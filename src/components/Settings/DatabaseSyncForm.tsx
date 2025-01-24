import { Formik, Form } from 'formik';
import { Translate } from 'react-redux-i18n';
import { toast } from 'react-toastify';

import Button from '../common/Button';
import FormSchema from './FormSchema';
import { getSyncFormSchema, storeSyncSettings } from '../../services/settings/syncSettings';
import { reconnect } from '../../services/database/PgliteDatabase';
import { settingsCard } from './SettingsForm';

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
      {({ isSubmitting }) => (
        <Form>
          <h2 className='text-2xl py-3 text-base-content'>
            <Translate value="labels.sync" />
          </h2>

          <div className={settingsCard}>
            <FormSchema schema={schema} />

            <div className='w-full flex justify-center mt-12'>
              <div className='max-w-xs w-full'>
                <Button
                  fullWidth
                  size='2xl'
                  disabled={isSubmitting}
                  type='submit'
                  className='btn-primary'
                >
                  <Translate value="buttons.save" />
                </Button>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default DatabaseSyncForm; 