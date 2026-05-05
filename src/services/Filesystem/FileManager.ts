import Filesystem from "./index";
import { set } from "idb-keyval";
import { createLogger } from "../../utils/logger";

const logger = createLogger({ namespace: "FileManager" });

interface ProcessedFile {
  file: File | FileSystemHandle;
  handler: FileSystemHandle;
}

const FileManager = () => {
  let directoryHandler: FileSystemDirectoryHandle | FileSystemHandle | FileList | null = null;
  const fileHandlers: Array<FileSystemHandle> = [];

  const openDialog = async (): Promise<ProcessedFile[]> => {
    directoryHandler = await Filesystem.openDialog();
    set("directoryHandler", directoryHandler);
    const values =
      ((directoryHandler as FileSystemDirectoryHandle).values && (directoryHandler as FileSystemDirectoryHandle).values()) ||
      directoryHandler;

    logger.debug("directoryHandler: ", directoryHandler);

    const files: Array<ProcessedFile> = [];

    for await (const entry of values as AsyncIterable<FileSystemHandle>) {
      fileHandlers.push(entry);

      const file = await processSelectedFile(entry);
      files.push(file);
    }

    return files;
  };

  const processSelectedFile = async (
    entry: FileSystemHandle
  ): Promise<ProcessedFile> => {
    let file: File | FileSystemHandle;

    logger.debug(`saving handler ${entry.name} for later use`);

    if (entry.kind === "file" && entry instanceof FileSystemFileHandle) {
      await set(entry.name, entry);
      file = await entry.getFile();
    } else {
      file = entry;
      await set(file.name, file);
    }

    return {
      file: file,
      handler: entry,
    };
  };

  return {
    openDialog,
    processSelectedFile,
  };
};

const fileManager = FileManager();

export default fileManager;
