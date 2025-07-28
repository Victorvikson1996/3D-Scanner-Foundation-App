import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type TabParamList = {
  Scanner: undefined;
  Viewer: undefined;
  Settings: undefined;
};

export type ScannerScreenProps = BottomTabScreenProps<TabParamList, 'Scanner'>;
export type ViewerScreenProps = BottomTabScreenProps<TabParamList, 'Viewer'>;
export type SettingsScreenProps = BottomTabScreenProps<
  TabParamList,
  'Settings'
>;
