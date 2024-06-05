from flask import Flask, request, jsonify
import joblib
from flask_cors import CORS
import nltk
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
import re
import torch
from transformers import BertTokenizer, BertForSequenceClassification

nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Load the model
model = BertForSequenceClassification.from_pretrained('./trained_llm_model')
tokenizer = BertTokenizer.from_pretrained('huawei-noah/TinyBERT_General_4L_312D')


# Removing HTML tags
def cleanHtml(sentence):
  cleanr = re.compile('<.*?>')
  cleantext = re.sub(cleanr, ' ', str(sentence))
  return cleantext


# Removing punctuation or special characters
def cleanPunc(sentence):
  cleaned = re.sub(r'[?|!|\'|"|#]', r'', sentence)
  cleaned = re.sub(r'[.|,|)|(|\|/]', r' ', cleaned)
  cleaned = cleaned.strip()
  cleaned = cleaned.replace("\n", " ")
  return cleaned


# Removing non-alphabetical characters
def keepAlpha(sentence):
  alpha_sent = ""
  for word in sentence.split():
    alpha_word = re.sub('[^a-z A-Z]+', ' ', word)
    alpha_sent += alpha_word + " "
  return alpha_sent.strip()


# Removing stop words
stop_words = set(stopwords.words('english'))
stop_words.update(
  ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'may', 'also', 'across',
   'among', 'beside', 'however', 'yet', 'within'])
re_stop_words = re.compile(r"\b(" + "|".join(stop_words) + ")\\W", re.I)


def removeStopWords(sentence):
  global re_stop_words
  return re_stop_words.sub(" ", sentence)


# Steaming words - converting words that mean the same thing to the same word
stemmer = SnowballStemmer("english")


def stemming(sentence):
  stemSentence = ""
  for word in sentence.split():
    stem = stemmer.stem(word)
    stemSentence += stem + " "
  return stemSentence.strip()


# Tokenize and prepare input for the model
def tokenize_input(text):
  inputs = tokenizer(text, padding='max_length', truncation=True, max_length=128, return_tensors="pt")
  return inputs


@app.route('/predict', methods=['POST'])
def predict():
  data = request.get_json()
  data = dict(data)

  text_to_predict = data.get('text')
  text_to_predict = text_to_predict.lower()
  text_to_predict = cleanHtml(text_to_predict)
  text_to_predict = cleanPunc(text_to_predict)
  text_to_predict = keepAlpha(text_to_predict)
  text_to_predict = stemming(text_to_predict)
  text_to_predict = removeStopWords(text_to_predict)

  inputs = tokenize_input(text_to_predict)

  with torch.no_grad():
    outputs = model(**inputs)
    prediction = torch.sigmoid(outputs.logits).round().detach().cpu().numpy()

  predicted_labels = [int(pred) for pred in prediction[0]]
  response = {'predictions': predicted_labels}
  print(response)
  return jsonify(response)


if __name__ == '__main__':
  app.run(debug=True, port=5000)
