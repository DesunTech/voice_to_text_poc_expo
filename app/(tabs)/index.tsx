import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function HomeScreen() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Tap the button to start speaking');
  const [error, setError] = useState('');
  const [textBeforeListening, setTextBeforeListening] = useState(''); // Store text before starting voice input

  useEffect(() => {
    // Define event handlers
    const onSpeechStart = (e: any) => {
      console.log('onSpeechStart: ', e);
      setStatus('Listening...');
      setIsListening(true);
      setError('');
    };

    const onSpeechEnd = (e: any) => {
      console.log('onSpeechEnd: ', e);
      setStatus('Processing... Tap button to start.'); // Give clearer next step
      setIsListening(false);
    };

    const onSpeechError = (e: any) => {
      console.log('onSpeechError: ', e);
      setError(JSON.stringify(e.error));
      setStatus('Error. Tap button to try again.');
      setIsListening(false); // Ensure listening state is reset on error
    };

    const onSpeechResults = (e: any) => {
      console.log('onSpeechResults: ', e);
      if (e.value && e.value.length > 0) {
        // Use textBeforeListening as the base for the final result
        setText(textBeforeListening + (textBeforeListening ? ' ' : '') + e.value[0]);
      }
    };

    const onSpeechPartialResults = (e: any) => {
      console.log('onSpeechPartialResults: ', e);
      if (e.value && e.value.length > 0) {
        // Use textBeforeListening as the base for the partial result update
        setText(textBeforeListening + (textBeforeListening ? ' ' : '') + e.value[0]);
      }
    };

    // Add listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    // Cleanup function
    return () => {
      // Remove all listeners and destroy the voice instance
      // It's important to destroy before removing listeners according to some docs/issues
      Voice.destroy().then(Voice.removeAllListeners).catch(e => console.error("Error destroying voice instance:", e));
    };
  }, [textBeforeListening]); // Update listeners if textBeforeListening changes (needed for closures)

  const startListening = async () => {
    if (isListening) { // Prevent starting if already listening
        console.log("Already listening, stop first.");
        await stopListening(); // Attempt to stop cleanly before starting again
    }
    try {
      // Reset states before starting
      setError('');
      setTextBeforeListening(text); // Store current text before starting
      setStatus('Starting...'); // Indicate starting phase
      await Voice.start('en-US');
      console.log('Voice recognition started');
      // Status updated by onSpeechStart
    } catch (e) {
      console.error('Error starting voice recognition: ', e);
      setError(JSON.stringify(e));
      setStatus('Error starting. Tap to retry.');
      setIsListening(false); // Ensure state is reset
    }
  };

  const stopListening = async () => {
     if (!isListening) { // Prevent stopping if not listening
        console.log("Not listening, cannot stop.");
        return;
     }
    try {
      setStatus('Stopping...'); // Indicate stopping phase
      await Voice.stop();
      console.log('Voice recognition stopped');
      setIsListening(false);
      // Status updated by onSpeechEnd or onSpeechError
    } catch (e) {
      console.error('Error stopping voice recognition: ', e);
      setError(JSON.stringify(e));
      setStatus('Error stopping. Tap to retry.');
      setIsListening(false); // Ensure state is reset
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Renamed handler for clarity
  const handleTextChange = (newText: string) => {
      // If the user types while the app *thought* it was listening (e.g., due to error/state mismatch),
      // ensure isListening is false.
      if (isListening) {
          setIsListening(false);
          setStatus('Typing detected, listening stopped.');
      }
      setText(newText);
      // We don't need to manage textBeforeListening here,
      // it gets updated only when startListening is explicitly called.
  }


  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{status}</Text>
      <TextInput
        style={styles.textInput}
        multiline
        onChangeText={handleTextChange} // Use the new handler
        value={text}
        placeholder="Speak or type here..."
        // Let's keep it always editable based on requirement to mix typing/voice
        // editable={!isListening}
      />
      <Button
        title={isListening ? 'Stop Listening' : 'Start Listening'}
        onPress={toggleListening}
        disabled={status === 'Starting...' || status === 'Stopping...'} // Prevent rapid clicks
      />
      {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
    </View>
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
