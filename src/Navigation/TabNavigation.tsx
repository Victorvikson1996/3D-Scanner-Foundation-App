import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Camera, Settings, Scan } from 'lucide-react-native';
import { ScannerScreen } from '@/screens/ScannerScreen';
import { ViewerScreen } from '@/screens/ViewerScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

type TabIconProps = {
  size: number;
  color: string;
  focused: boolean;
};

export const TabNavigation = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopColor: '#333'
          },
          tabBarActiveTintColor: '#00ff88',
          tabBarInactiveTintColor: '#666'
        }}
      >
        <Tab.Screen
          name='Scanner'
          component={ScannerScreen}
          options={{
            title: 'Scanner',
            tabBarIcon: ({ size, color }: TabIconProps) => (
              <Camera size={size} color={color} />
            )
          }}
        />
        <Tab.Screen
          name='Viewer'
          component={ViewerScreen}
          options={{
            title: '3D Viewer',
            tabBarIcon: ({ size, color }: TabIconProps) => (
              <Scan size={size} color={color} />
            )
          }}
        />
        <Tab.Screen
          name='Settings'
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }: TabIconProps) => (
              <Settings size={size} color={color} />
            )
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
