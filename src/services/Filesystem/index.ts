declare const window: Window & {
  showDirectoryPicker?: (options?: Record<string, unknown>) => Promise<FileSystemDirectoryHandle>;
  chooseFileSystemEntries?: (options?: Record<string, unknown>) => Promise<FileSystemHandle>;
};


class Filesystem {
  hasFSAccess = 'chooseFileSystemEntries' in window ||
    'showDirectoryPicker' in window

  getFileLegacy = () => {
    const filePicker = document.getElementById('filePicker')

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
      }

      filePicker.click()
    })
  }

  openDialog = (): Promise<FileSystemDirectoryHandle | FileSystemHandle | FileList> => {
    if (!this.hasFSAccess) {
      return this.getFileLegacy() as Promise<FileList>
    }

    // For Chrome 86 and later...
    if ('showDirectoryPicker' in window && window.showDirectoryPicker) {
      return window.showDirectoryPicker({ mode: 'readwrite' });
    }
    // For Chrome 85 and earlier...
    if (window.chooseFileSystemEntries) {
      return window.chooseFileSystemEntries({ multiple: true }) as Promise<FileSystemHandle>
    }

    return this.getFileLegacy() as Promise<FileList>
  }
}

const singleton = new Filesystem()
export default singleton
