import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const QuestionnaireScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await client.get('/questionnaire/questions');

      console.log('RESPUESTA API:', response.data);
      console.log('PREGUNTAS:', response.data.data);

      if (response.data.success) {
        setQuestions(response.data.data.questions);
        console.log('STATE QUESTIONS:', response.data.data.questions);
      }
    } catch (error) {
      console.log('ERROR:', error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      Alert.alert('Atención', 'Por favor responde todas las preguntas');
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        const selectedOption = question.options.find(
          opt => opt.id === optionId
        );

        return {
          question_id: parseInt(questionId),
          answer: selectedOption.text
        };
      });

      const response = await client.post('/questionnaire/submit', {
        user_id: user.id,
        answers: formattedAnswers,
      });

      if (response.data.success) {
        Alert.alert('¡Listo!', 'Tus preferencias fueron guardadas', [
          { text: 'Ver recomendaciones', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el cuestionario');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>¿Qué te gusta?</Text>
      <Text style={styles.subtitle}>Cuéntanos tus preferencias para recomendarte los mejores lugares</Text>

      {questions?.map((question) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionText}>
            {question.question_text}
          </Text>

          {question.options?.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                answers[question.id] === option.id &&
                  styles.optionSelected
              ]}
              onPress={() =>
                handleAnswer(question.id, option.id)
              }
            >
              <Text
                style={[
                  styles.optionText,
                  answers[question.id] === option.id &&
                    styles.optionTextSelected
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Ver mis recomendaciones</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E85D04',
    marginTop: 50,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  questionCard: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#E85D04',
    borderColor: '#E85D04',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#E85D04',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuestionnaireScreen;