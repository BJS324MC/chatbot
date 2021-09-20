(async ()=>{
data=await(await fetch('intents.json')).json();

training_sentences = [],
training_labels = [],
labels = [],
responses = [];

for(let intent of data.intents){
  for(let pattern of intent.patterns){
    training_sentences.push(pattern);
    training_labels.push(intent.tag);
  }
  responses.push(intent.responses);
  
  if(!(intent.tag in labels))
    labels.push(intent.tag);
}

num_classes = labels.length;

lbl_encoder = new LabelEncoder();
lbl_encoder.fit(training_labels);
training_labels = lbl_encoder.transform(training_labels);

vocab_size = 100,
embedding_dim = 16,
max_len = 20,
oov_token="<OOV>";

tokenizer = new Tokenizer({num_words:vocab_size,oov_token:oov_token});
tokenizer.fitOnTexts(training_sentences);
word_index = tokenizer.word_index,
sequences = tokenizer.textsToSequences(training_sentences),
padded_sequences = padSequences(sequences, {truncating : 'post', maxLen : max_len});
  
const {embedding,globalAveragePooling1d,dense}=tf.layers;

model = tf.sequential();
model.add(embedding({inputDim:vocab_size,outputDim:embedding_dim, inputLength: max_len}));
model.add(globalAveragePooling1d());
model.add(dense({units:16, activation: 'relu'}));
model.add(dense({units:16, activation: 'relu'}));
model.add(dense({units:num_classes, activation:'softmax'}));

model.compile({
  loss:'sparseCategoricalCrossentropy',
  optimizer:'adam', 
  metrics: ['accuracy']
});

//const surface = { name: 'Model Summary', tab: 'Model Inspection' };
//tfvis.show.modelSummary(surface, model);
model=await tf.loadLayersModel("models/yed.json");

/*result=await model.fit(tf.tensor(padded_sequences), tf.tensor(training_labels), {
  epochs: 400,
  callbacks: tfvis.show.fitCallbacks({ name: 'Model Stats', tab: 'Training' }, ['loss', 'acc']),
})*/

})();
function message(txt,right=true){
  let msg=document.createElement("div");
  msg.innerHTML=txt;
  msg.style.animation="popup 0.5s";
  msg.classList.add(right?"right":"left");
  document.getElementById("chatroom").appendChild(msg);
}
function randomElement(arr){
  return arr[~~(arr.length*Math.random())];
}
function send(input){
  let result=model.predict(tf.tensor(padSequences(tokenizer.textsToSequences([input]),
    {truncating:'post',maxLen:max_len})));
  const tag = lbl_encoder.inverseTransform([result.reshape([22]).argMax().arraySync()])[0];
  return randomElement(data.intents.find(a=>a.tag === tag).responses);
}
document.getElementById("send").addEventListener("click",a=>{
  const vv=document.getElementById("input").value;
  message(vv,true);
  document.getElementById("input").value="";
  setTimeout(a=>message(send(vv),false),400);
});