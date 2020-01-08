const defer = function() {
    let result = {};
    result.promise = new Promise(function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
};

const applyWorker = (worker) => {
	return createStore => (reducer, initialState, enhancer) => {
		if (!(worker instanceof Worker)) {
			console.error('Expect input to be a Web Worker. Fall back to normal store.');
			return createStore(reducer, initialState, enhancer);
		}

		// New reducer for workified store
		let replacementReducer = (state, action) => {
			if (action.state) {
				return action.state;
			}
			return state;
		}

		// Start task id;
		let taskId = 0;
		let taskCompleteCallbacks = {};

		// Create store using new reducer
		let store = createStore(replacementReducer, reducer({}, {}), enhancer);

		// Store reference of old dispatcher
		let next = store.dispatch;

		// Replace dispatcher
		store.dispatch = (action) => {
			if (typeof action.type === 'string') {
				if (window.disableWebWorker) {
					return next({
						type: action.type,
						state: reducer(store.getState(), action)
					});
				}
				worker.postMessage(action);
			}

			if (typeof action.task === 'string') {
				let task = Object.assign({}, action, { _taskId: taskId });
				let deferred = defer();

				taskCompleteCallbacks[ taskId ] = deferred
				taskId++;
				worker.postMessage(task);
				return deferred.promise;
			}
		}

		store.isWorker = true;

		// Add worker events listener
		worker.addEventListener('message', function(e) {
			let action = e.data;

      console.log('action received to worker: ', action)

			if (typeof action.type === 'string') {
				next(action);
			}

			if (typeof action._taskId === 'number') {
				let wrapped = taskCompleteCallbacks[ action._taskId ];

				if (wrapped) {
					wrapped.resolve(action);
					delete taskCompleteCallbacks[ action._taskId ];
				}
			}
		});

		return store;
	}
}

export default applyWorker
