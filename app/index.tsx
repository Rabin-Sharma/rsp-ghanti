import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function App() {
  const last = useRef({ x: 0, y: 0, z: 0 });
  const lastShake = useRef(0);
  const sound = useRef(null);
  const rotation = useRef(new Animated.Value(0)).current;

  const SHAKE_THRESHOLD = 1.1;   // sensitivity
  const SHAKE_DELAY = 150;       // ms - reduced for more responsive ringing

  useEffect(() => {
    loadSound();
    Accelerometer.setUpdateInterval(50);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const delta =
        Math.abs(x - last.current.x) +
        Math.abs(y - last.current.y) +
        Math.abs(z - last.current.z);

      if (
        delta > SHAKE_THRESHOLD &&
        Date.now() - lastShake.current > SHAKE_DELAY
      ) {
        playBell();
        lastShake.current = Date.now();
      }

      last.current = { x, y, z };
    });

    return () => {
      subscription && subscription.remove();
      sound.current && sound.current.unloadAsync();
    };
  }, []);

  const loadSound = async () => {
    const { sound: bell } = await Audio.Sound.createAsync(
      require('../assets/bell2.mp3')
    );
    sound.current = bell;
  };

  const playBell = async () => {
    if (!sound.current) return;
    
    // Haptic feedback for realistic feel - using Heavy for stronger vibration
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.log('Haptics not available:', error);
    }
    
    // Swing animation
    Animated.sequence([
      Animated.timing(rotation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    await sound.current.stopAsync();
    await sound.current.playAsync();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/bell.png')}
        style={[
          styles.image,
          { transform: [{ rotate: rotateInterpolate }] }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C95D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
});
