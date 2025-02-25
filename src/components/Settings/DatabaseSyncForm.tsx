import { Formik, Form, FormikErrors } from 'formik';
import { Translate } from 'react-redux-i18n';
import { toast } from 'react-toastify';
import classNames from 'classnames';

import FormSchema from './FormSchema';
import { getSyncFormSchema, storeSyncSettings, type SyncSettings } from '../../services/settings/syncSettings';
import { reconnect } from '../../services/database/PgliteDatabase';

const validateForm = (values: SyncSettings): FormikErrors<SyncSettings> => {
  const errors: FormikErrors<SyncSettings> = {};
  const urlPattern = /^https?:\/\/.+/i;

  if (values.enabled && !values.serverUrl) {
    errors.serverUrl = 'Server URL is required when sync is enabled';
  } else if (values.serverUrl && !urlPattern.test(values.serverUrl)) {
    errors.serverUrl = 'Invalid URL format';
  }

  return errors;
};

const DatabaseSyncForm = () => {
  const schema = getSyncFormSchema();
  const initialValues: SyncSettings = {
    enabled: schema.fields[0].value as boolean,
    serverUrl: schema.fields[1].value as string,
  };

  const handleSubmit = async (values: SyncSettings) => {
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
      initialValues={initialValues}
      validate={validateForm}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ errors, touched }) => (
        <Form>
          <div>
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
              {errors.serverUrl && touched.serverUrl && (
                <div className="alert alert-error mt-4">
                  <div>{errors.serverUrl}</div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button type="submit" className="btn btn-primary">
                <Translate value="buttons.save" />
              </button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default DatabaseSyncForm; 