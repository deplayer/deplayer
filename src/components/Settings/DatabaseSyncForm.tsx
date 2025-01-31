import { Formik, Form } from 'formik';
import { Translate } from 'react-redux-i18n';
import { toast } from 'react-toastify';
import classNames from 'classnames';

import FormSchema from './FormSchema';
import { getSyncFormSchema, storeSyncSettings } from '../../services/settings/syncSettings';
import { reconnect } from '../../services/database/PgliteDatabase';

const DatabaseSyncForm = () => {
  const schema = getSyncFormSchema();

  const handleSubmit = async (values: any) => {
    try {
      storeSyncSettings(values);
      await reconnect();
      toast.success('Sync settings saved');
    } catch (error) {
      console.error('Error saving sync settings:', error);
      toast.error('Error saving sync settings');
    }
  };

  return (
    <Formik
      initialValues={schema.fields.reduce((acc: any, field: any) => {
        if (field.name) {
          acc[field.name] = field.value;
        }
        return acc;
      }, {})}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {() => (
        <Form>

          <FormSchema schema={schema} />
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
        </Form>
      )}
    </Formik>
  );
};

export default DatabaseSyncForm; 