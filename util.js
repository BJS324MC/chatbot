class LabelEncoder{
  fit(arr){
    this.labels={};
    this.inverseLabels={};
    let i=0;
    for(let a of arr){
      if(!(a in this.labels)){
        this.labels[a]=i;
        this.inverseLabels[i]=a;
        i++;
      };
    }
  }
  transform(arr){
    return arr.map(a=>this.labels[a]);
  }
  inverseTransform(arr) {
    return arr.map(a => this.inverseLabels[a]);
  }
}
class Tokenizer {
  constructor(config = {}) {
    this.filters = config.filters || /[\\.,/#!$%^&*;:{}=\-_`~()]/g;
    this.num_words = parseInt(config.num_words) || null;
    this.oov_token = config.oov_token || "";
    this.lower = typeof config.lower === "undefined" ? true : config.lower;
    this.word_index = {};
    this.index_word = {};
    this.word_counts = {};
  }
  cleanText(text) {
    if (this.lower) text = text.toLowerCase();
    return text
      .replace(this.filters, "")
      .replace(/\s{2,}/g, " ")
      .split(" ");
  }
  fitOnTexts(texts) {
    texts.forEach((text) => {
      text = this.cleanText(text);
      text.forEach((word) => {
        this.word_counts[word] = (this.word_counts[word] || 0) + 1;
      });
    });

    let vec = Object.entries(this.word_counts).sort((a, b) => b[1] - a[1]);
    if (this.oov_token) vec.unshift([this.oov_token, 0]);
    vec.every(([word, number], i) => {
      this.word_index[word] = i + 1;
      this.index_word[i + 1] = word;
      return true;
    });
  }
  textsToSequences(texts) {
    return texts.map((text) =>
      this.cleanText(text).flatMap((word) =>
        this.word_index[word] &&
        (this.num_words === null || this.word_index[word] < this.num_words)
          ? this.word_index[word]
          : this.oov_token
          ? 1
          : []
      )
    );
  }
  toJson(replacer, space) {
    return JSON.stringify(
      {
        word_index: this.word_index,
        index_word: this.index_word,
        word_counts: this.word_counts,
      },
      replacer,
      space
    );
  }
}
function padSequences(sequences,{maxLen=Math.max(...sequences.map(a=>a.length)),padding="pre",truncating="pre",value=0}){
  let newSequences=[];
  for(let sequence of sequences){
    if(sequence.length < maxLen){
      newSequences.push(padding==="pre" ? Array(maxLen-sequence.length).fill(value).concat(sequence):
      padding==="post"?sequence.concat(Array(maxLen-sequence.length).fill(value)):sequence);
    }else if(maxLen && sequence.length > maxLen){
      if(truncating==="pre")newSequences.push(sequence.slice(sequence.length-maxLen));
      else if(truncating==="post")newSequences.push(sequence.slice(0,maxLen));
    }else newSequences.push(sequence)
  }
  return newSequences;
}