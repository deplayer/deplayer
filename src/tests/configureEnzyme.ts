import { configure } from 'enzyme'
import * as ReactSixteenAdapter from 'enzyme-adapter-react-16';

const configureJest = () => {
  configure({ adapter: new ReactSixteenAdapter() })
}

export default configureJest
