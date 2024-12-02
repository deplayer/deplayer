import React from 'react';
import { useDispatch } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import Button from '../common/Button';
import Icon from '../common/Icon';
import * as types from '../../constants/ActionTypes';

interface Props {
  providerKey: string;
}

const SyncButton: React.FC<Props> = ({ providerKey }) => {
  const dispatch = useDispatch();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = () => {
    setSyncing(true);
    dispatch({ type: types.START_PROVIDER_SYNC, providerKey });
  };

  React.useEffect(() => {
    const handleSyncFinished = () => setSyncing(false);
    window.addEventListener(types.PROVIDER_SYNC_FINISHED, handleSyncFinished);
    window.addEventListener(types.PROVIDER_SYNC_FAILED, handleSyncFinished);
    
    return () => {
      window.removeEventListener(types.PROVIDER_SYNC_FINISHED, handleSyncFinished);
      window.removeEventListener(types.PROVIDER_SYNC_FAILED, handleSyncFinished);
    };
  }, []);

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      transparent
    >
      <Icon icon={syncing ? "faSpinner" : "faSync"} className="mr-2" />
      <Translate value="buttons.syncProvider" />
    </Button>
  );
};

export default SyncButton; 