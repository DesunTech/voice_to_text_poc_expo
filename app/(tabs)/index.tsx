import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function HomeScreen() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Tap the button to start speaking');
  const [error, setError] = useState('');
  const [textBeforeListening, setTextBeforeListening] = useState('');

  // Refs to access latest state in useCallback handlers without causing re-renders/effect re-runs
  const textRef = useRef(text);
  const textBeforeListeningRef = useRef(textBeforeListening);

  // Keep refs updated
  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { textBeforeListeningRef.current = textBeforeListening; }, [textBeforeListening]);

  // Define event handlers using useCallback and refs
  const onSpeechStartHandler = useCallback((e: any) => {
    console.log('onSpeechStart: ', e);
    setStatus('Listening...');
    setIsListening(true);
    setError('');
  }, [setStatus, setIsListening, setError]); // Dependencies are stable state setters

  const onSpeechEndHandler = useCallback((e: any) => {
    console.log('onSpeechEnd: ', e);
    setStatus('Processing... Tap button to start.');
    setIsListening(false);
  }, [setStatus, setIsListening]);

  const onSpeechErrorHandler = useCallback((e: any) => {
    console.log('onSpeechError: ', e);
    setError(JSON.stringify(e.error));
    setStatus('Error. Tap button to try again.');
    setIsListening(false);
  }, [setError, setStatus, setIsListening]);

  const onSpeechResultsHandler = useCallback((e: any) => {
    console.log('onSpeechResults: ', e);
    if (e.value && e.value.length > 0) {
      const currentTextBefore = textBeforeListeningRef.current; // Use ref
      setText(currentTextBefore + (currentTextBefore ? ' ' : '') + e.value[0]); // Update state
    }
    // isListening and status are handled by onSpeechEnd/onSpeechError
  }, [setText]); // textBeforeListeningRef is stable, setText is stable

  const onSpeechPartialResultsHandler = useCallback((e: any) => {
    console.log('onSpeechPartialResults: ', e);
    if (e.value && e.value.length > 0) {
      const currentTextBefore = textBeforeListeningRef.current; // Use ref
      setText(currentTextBefore + (currentTextBefore ? ' ' : '') + e.value[0]); // Update state
    }
  }, [setText]); // textBeforeListeningRef is stable, setText is stable

  // Effect for registering/unregistering listeners ONCE
  useEffect(() => {
    console.log("Setting up Voice listeners");
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechError = onSpeechErrorHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;
    Voice.onSpeechPartialResults = onSpeechPartialResultsHandler;

    return () => {
      console.log("Cleaning up Voice listeners and destroying instance");
      // Destroy the instance and then remove all listeners
      Voice.destroy()
           .then(Voice.removeAllListeners)
           .catch(e => console.error("Error destroying voice instance or removing listeners during cleanup:", e));
    };
  }, [onSpeechStartHandler, onSpeechEndHandler, onSpeechErrorHandler, onSpeechResultsHandler, onSpeechPartialResultsHandler]); // Handlers are stable due to useCallback


  const stopListening = useCallback(async () => {
    // Use state directly here for the check, as it affects render
    if (!isListening) {
       console.log("Not listening, cannot stop.");
       return;
    }
   try {
     setStatus('Stopping...');
     await Voice.stop();
     console.log('Voice recognition stopped');
     // State (isListening, status) is primarily updated by onSpeechEnd/onSpeechError handlers now
   } catch (e) {
     console.error('Error stopping voice recognition: ', e);
     setError(JSON.stringify(e));
     setStatus('Error stopping. Tap to retry.');
     setIsListening(false); // Ensure state is reset on direct stop error
   }
 }, [isListening, setStatus, setError, setIsListening]); // Include state used in the check/logic

  const startListening = useCallback(async () => {
    if (isListening) {
        console.log("Already listening, attempting to stop first.");
        await stopListening(); // Use the useCallback version of stopListening
    }
    try {
      setError('');
      // Use the *current* text state directly here
      setTextBeforeListening(textRef.current);
      setStatus('Starting...');
      await Voice.start('en-US');
      console.log('Voice recognition started');
      // isListening/status state updated by onSpeechStart handler
    } catch (e) {
      console.error('Error starting voice recognition: ', e);
      setError(JSON.stringify(e));
      setStatus('Error starting. Tap to retry.');
      setIsListening(false); // Ensure state is reset on start error
    }
  }, [isListening, stopListening, setError, setTextBeforeListening, setStatus, setIsListening]); // Include dependencies

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleTextChange = useCallback((newText: string) => {
      if (isListening) {
          console.log("Typing detected while listening, stopping voice.");
          stopListening(); // Call the memoized stop function
      }
      setText(newText);
  }, [isListening, stopListening, setText]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.statusText}>{status}</Text>
        <TextInput
          style={styles.textInput}
          multiline
          onChangeText={handleTextChange}
          value={text}
          placeholder="Speak or type here..."
        />
        <Button
          title={isListening ? 'Stop Listening' : 'Start Listening'}
          onPress={toggleListening}
          disabled={status === 'Starting...' || status === 'Stopping...'}
        />
        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: Platform.OS === 'android' ? 40 : 0, // Adjust margin for Android status bar
  },
  textInput: {
    height: 150,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    textAlignVertical: 'top', // Ensures text starts from the top on Android
  },
  statusText: {
    fontSize: 18,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  // Remove unused styles like titleContainer, stepContainer, reactLogo
});
