import { useState, useEffect, useCallback } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [permissionGranted, setPermissionGranted] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = all
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `마이크 ${d.deviceId.slice(0, 6)}`,
        }));
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !audioInputs.find(d => d.deviceId === selectedDeviceId)) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch {
    }
  }, [selectedDeviceId]);

  // Request mic permission once to get labeled device names
  const requestPermissionAndLoad = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPermissionGranted(true);
      await loadDevices();
    } catch {
    }
  }, [loadDevices]);

  useEffect(() => {
    // Try to load devices without permission first (labels may be hidden)
    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, []);

  return { devices, selectedDeviceId, setSelectedDeviceId, permissionGranted, requestPermissionAndLoad };
}
