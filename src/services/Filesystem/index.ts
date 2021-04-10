declare const window: any;


class Filesystem {
  hasFSAccess = 'chooseFileSystemEntries' in window ||
    'showDirectoryPicker' in window

  getFileLegacy = () => {
    const filePicker = document.getElementById('filePicker');

    if (!filePicker) {
      throw new Error('No file input#filePicker found')
    }

    return new Promise((resolve, reject) => {
      filePicker.onchange = (event) => {
        const { files } = event.target as HTMLInputElement
        if (files) {
          resolve(files)
          return
        }
        reject(new Error('AbortError'));
      };

      filePicker.click()
    });
  }

  openDialog = (): Promise<any> => {
    if (!this.hasFSAccess) {
      return this.getFileLegacy()
    }

    const options = {
      multiple: true
    }
    // For Chrome 86 and later...
    if ('showDirectoryPicker' in window) {
      return window.showDirectoryPicker({ mode: 'readwrite' });
    }
    // For Chrome 85 and earlier...
    return window.chooseFileSystemEntries(options)
  }
}

const singleton = new Filesystem()
export default singleton
