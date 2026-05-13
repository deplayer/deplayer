import React, { useEffect, useState } from 'react';
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
  const [syncing, setSyncing] = useState(false);
  const syncingRef = React.useRef(syncing);
  syncingRef.current = syncing;

  useEffect(() => {
    const handleFinished = () => {
      if (syncingRef.current) {
        setSyncing(false);
      }
    };
    window.addEventListener(types.PROVIDER_SYNC_FINISHED, handleFinished);
    window.addEventListener(types.PROVIDER_SYNC_FAILED, handleFinished);
    
    return () => {
      window.removeEventListener(types.PROVIDER_SYNC_FINISHED, handleFinished);
      window.removeEventListener(types.PROVIDER_SYNC_FAILED, handleFinished);
    };
  }, [providerKey]);

  const handleSync = () => {
    setSyncing(true);
    dispatch({ type: types.START_PROVIDER_SYNC, providerKey });
  };

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
