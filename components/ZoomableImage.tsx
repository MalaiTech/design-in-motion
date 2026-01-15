
import React, { useRef } from 'react';
import { StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ZoomableImageProps {
  uri: string;
  style?: any;
}

export default function ZoomableImage({ uri, style }: ZoomableImageProps) {
  console.log('ZoomableImage: Rendering zoomable image');
  
  // Shared values for pinch gesture
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  
  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      console.log('ZoomableImage: Pinch gesture scale:', event.scale);
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      console.log('ZoomableImage: Pinch gesture ended, final scale:', scale.value);
      savedScale.value = scale.value;
      
      // Reset if zoomed out too much
      if (scale.value < 1) {
        console.log('ZoomableImage: Resetting zoom to 1');
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      
      // Limit max zoom
      if (scale.value > 5) {
        console.log('ZoomableImage: Limiting zoom to 5');
        scale.value = withSpring(5);
        savedScale.value = 5;
      }
    });
  
  // Pan gesture for moving zoomed image
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow panning when zoomed in
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });
  
  // Double tap to zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      console.log('ZoomableImage: Double tap detected, current scale:', scale.value);
      if (scale.value > 1) {
        // Zoom out
        console.log('ZoomableImage: Zooming out to 1');
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2x
        console.log('ZoomableImage: Zooming in to 2');
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });
  
  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture
  );
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, style]}>
        <Animated.Image
          source={{ uri }}
          style={[styles.image, animatedStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 100,
  },
});
