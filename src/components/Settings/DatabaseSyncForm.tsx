import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';

import { type SyncSettings } from '../../services/settings/syncSettings';

type Props = {
  values: {
    app: {
      sync?: SyncSettings;
    };
  };
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
};

const DatabaseSyncForm = ({ values, setFieldValue }: Props) => {

  return (
    <div>
      <div className="my-3">
        <div className="w-full flex items-center">
          <label className="w-40 capitalize text-xl">
            <Translate value="labels.enableSync" />
          </label>
          <div className="w-full toggle-control flex justify-end">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              className="toggle toggle-primary"
              checked={values.app?.sync?.enabled ?? false}
              onChange={(e) => {
                setFieldValue('app.sync', {
                  ...values.app?.sync,
                  enabled: e.target.checked
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="my-3">
        <div className="w-full flex items-center">
          <label className="w-40 capitalize text-xl">
            <Translate value="labels.syncServerUrl" />
          </label>
          <input
            type="url"
            name="serverUrl"
            className="input input-bordered w-full"
            value={values.app?.sync?.serverUrl ?? 'http://localhost:3000'}
            onChange={(e) => {
              setFieldValue('app.sync', {
                ...values.app?.sync,
                serverUrl: e.target.value
              });
            }}
          />
        </div>
      </div>

      <div className={classNames("mb-4 prose")}>
        <p className="text-base-content opacity-80">
          <Translate value="labels.syncDescription" />
        </p>
        <div className="alert alert-info mt-4">
          <div>
            <p>
              <Translate value="labels.syncServerInstructions" />
              {' '}
              <a 
                href="https://gitlab.com/deplayer/deplayer/-/blob/master/README.md#sync-server-setup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="link link-primary-content"
              >
                <Translate value="labels.readDocs" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSyncForm; 