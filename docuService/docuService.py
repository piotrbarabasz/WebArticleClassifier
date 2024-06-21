from flask import Flask, request, jsonify
import joblib
from flask_cors import CORS
import nltk
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
import re
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import morfeusz2
from abc import ABC, abstractmethod

nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Load the model
model_en = BertForSequenceClassification.from_pretrained('./trained_llm_model')
model_pl = BertForSequenceClassification.from_pretrained('./trained_llm_model_pl')
tokenizer = BertTokenizer.from_pretrained('huawei-noah/TinyBERT_General_4L_312D')


class Preprocessor(ABC):
  def __init__(self):
    pass

  def clean_html(self, sentence):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', str(sentence))
    return cleantext

  def clean_punc(self, sentence):
    cleaned = re.sub(r'[?|!|\'|"|#]', r'', sentence)
    cleaned = re.sub(r'[.|,|)|(|\|/]', r' ', cleaned)
    cleaned = cleaned.strip()
    cleaned = cleaned.replace("\n", " ")
    return cleaned

  def keep_alpha(self, sentence):
    alpha_sent = ""
    for word in sentence.split():
      alpha_word = re.sub('[^a-z A-Z]+', ' ', word)
      alpha_sent += alpha_word + " "
    return alpha_sent.strip()

  @abstractmethod
  def remove_stop_words(self, sentence):
    pass

  @abstractmethod
  def stemming(self, sentence):
    pass


class EnglishPreprocessor(Preprocessor):
  def __init__(self):
    super().__init__()
    self.stop_words = set(stopwords.words('english'))
    self.stop_words.update(
      ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'may', 'also', 'across',
       'among', 'beside', 'however', 'yet', 'within'])
    self.re_stop_words = re.compile(r"\b(" + "|".join(self.stop_words) + ")\\W", re.I)
    self.stemmer = SnowballStemmer("english")

  def remove_stop_words(self, sentence):
    return self.re_stop_words.sub(" ", sentence)

  def stemming(self, sentence):
    stemSentence = ""
    for word in sentence.split():
      stem = self.stemmer.stem(word)
      stemSentence += stem + " "
    return stemSentence.strip()


class PolishPreprocessor(Preprocessor):
  def __init__(self):
    super().__init__()
    self.polish_stopwords = [
      'i', 'oraz', 'ale', 'a', 'z', 'w', 'na', 'do', 'od', 'za', 'przy', 'o', 'u', 'pod', 'nad',
      'po', 'przed', 'bez', 'dla', 'czy', 'że', 'to', 'jest', 'być', 'był', 'była', 'było', 'są',
      'się', 'sam', 'tak', 'nie', 'już', 'tylko', 'więc', 'kiedy', 'który', 'która', 'które',
      'ten', 'tamten', 'ta', 'te', 'ci', 'co', 'czyli', 'bardziej', 'mniej', 'tutaj', 'stąd',
      'wszędzie', 'gdzie', 'ktokolwiek', 'nikt', 'każdy', 'wszystko', 'nic', 'można', 'muszę',
      'musisz', 'chcę', 'chcesz', 'możesz', 'może', 'być', 'czemu', 'dlaczego', 'ponieważ', 'lecz',
      'zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć',
      'może', 'także', 'przez', 'między', 'obok', 'jednak', 'jeszcze', 'w środku'
    ]
    self.re_stop_words = re.compile(r"\b(" + "|".join(self.polish_stopwords) + ")\\W", re.I)
    self.morf = morfeusz2.Morfeusz()

  def remove_stop_words(self, sentence):
    return self.re_stop_words.sub(" ", sentence)

  def stemming(self, sentence):
    stemSentence = ""
    for word in sentence.split():
      analysis = self.morf.analyse(word)
      if analysis:
        stem = analysis[0][2][1].split(':')[0]
        stemSentence += stem + " "
      else:
        stemSentence += word + " "
    return stemSentence.strip()

def preprocess(text, preprocessor):
  text = text.lower()
  text = preprocessor.clean_html(text)
  text = preprocessor.clean_punc(text)
  text = preprocessor.keep_alpha(text)
  text = preprocessor.stemming(text)
  text = preprocessor.remove_stop_words(text)
  return text


def tokenize_input(text):
  inputs = tokenizer(text, padding='max_length', truncation=True, max_length=128, return_tensors="pt")
  return inputs


@app.route('/predict', methods=['POST'])
def predict():
  data = request.get_json()
  text_to_predict = data.get('text')

  preprocessor = EnglishPreprocessor()
  preprocessed_text = preprocess(text_to_predict, preprocessor)

  inputs = tokenize_input(preprocessed_text)

  with torch.no_grad():
    outputs = model_en(**inputs)
    prediction = torch.sigmoid(outputs.logits).round().detach().cpu().numpy()

  predicted_labels = [int(pred) for pred in prediction[0]]
  response = {'predictions': predicted_labels}
  print(response)
  return jsonify(response)


@app.route('/predict_pl', methods=['POST'])
def predict_pl():
  data = request.get_json()
  text_to_predict = data.get('text')

  preprocessor = PolishPreprocessor()
  preprocessed_text = preprocess(text_to_predict, preprocessor)

  inputs = tokenize_input(preprocessed_text)

  with torch.no_grad():
    outputs = model_pl(**inputs)
    prediction = torch.sigmoid(outputs.logits).round().detach().cpu().numpy()

  predicted_labels = [int(pred) for pred in prediction[0]]
  response = {'predictions': predicted_labels}
  print(response)
  return jsonify(response)

if __name__ == '__main__':
  app.run(debug=True, port=5000)

#run app: python docuService.py

