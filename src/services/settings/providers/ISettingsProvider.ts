export interface ISettingsProvider {
  isRepeatable?: boolean;
  getFormSchema(index?: string): {
    fields: Array<{
      title: string;
      name?: string;
      type: string;
      showSync?: boolean;
    }>;
  };
}
