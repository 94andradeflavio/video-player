export class VideoPlayer {
    constructor(videoUrl, subtitleUrl, containerId) {
      this.videoUrl = videoUrl;
      this.subtitleUrl = subtitleUrl;
      this.container = document.getElementById(containerId);
      this.videoElement = null;
      this.subtitleElement = null;
      this.subtitleCues = [];
      this.subtitleIndex = 0;
      this.init();
    }
  
    init() {
      this.container.innerHTML = `
        <div class="video-container">
          <video>
            <source src="${this.videoUrl}" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
          <div class="video-controls">
            <button class="play-pause">Play</button>
            <span class="legenda"></span>
            <span class="fonte-legenda">Fonte da Legenda</span>
          </div>
        </div>
      `;
      this.videoElement = this.container.querySelector('video');
      this.subtitleElement = this.container.querySelector('.legenda');
      this.loadSubtitles();
      this.bindEvents();
    }
  
    loadSubtitles() {
      fetch(this.subtitleUrl)
        .then(response => response.text())
        .then(data => {
          if (this.subtitleUrl.endsWith('.srt')) {
            this.parseSrtSubtitles(data);
          } else if (this.subtitleUrl.endsWith('.vtt')) {
            this.parseVttSubtitles(data);
          }
        });
    }
  
    parseSrtSubtitles(data) {
      const regex = /(\d+)\n([\d:,]+) --> ([\d:,]+)\n(.+?(?=\n\n|\n$))/gs;
      let match;
      while ((match = regex.exec(data))) {
        const [, index, start, end, text] = match;
        this.subtitleCues.push({
          index: parseInt(index),
          start: this.parseTime(start),
          end: this.parseTime(end),
          text,
        });
      }
      console.log('Subtitles loaded:', this.subtitleCues);
    }
  
    parseVttSubtitles(data) {
      const regex = /^([\d:.]+) --> ([\d:.]+)(.*)\n(.*)$/gm;
      let match;
      while ((match = regex.exec(data))) {
        const [, start, end, rest, text] = match;

        this.subtitleCues.push({
          index: this.subtitleCues.length + 1,
          start: this.parseTime(start),
          end: this.parseTime(end),
          text,
        });
      }
      console.log('Subtitles loaded:', this.subtitleCues);
    }
  
    parseTime(timeString) {
      const [minutes, seconds, miliseconds] = timeString.split(':');
      console.log(minutes, seconds, miliseconds)

      const converted = parseInt(minutes) * 60 + parseInt(seconds) + parseFloat(miliseconds.replace(',', '.') / 1000);
      console.log(converted)
      return converted;
    }
  
    bindEvents() {
      this.videoElement.addEventListener('timeupdate', () => {
        const currentTime = this.videoElement.currentTime;
        const subtitle = this.subtitleCues[this.subtitleIndex];

        if (subtitle && subtitle.start <= currentTime && subtitle.end >= currentTime) {
          this.subtitleElement.textContent = subtitle.text;
        } else {
          this.subtitleElement.textContent = '';
        }
        if (subtitle && subtitle.end < currentTime) {
            this.subtitleIndex++;
          }
        });
        
        this.container.querySelector('.play-pause').addEventListener('click', () => {
          if (this.videoElement.paused) {
            this.videoElement.play();
            this.container.querySelector('.play-pause').classList.remove('play');
            this.container.querySelector('.play-pause').classList.add('pause');
          } else {
            this.videoElement.pause();
            this.container.querySelector('.play-pause').classList.remove('pause');
            this.container.querySelector('.play-pause').classList.add('play');
          }
        });
        
        const fontSizes = ['12px', '14px', '16px', '18px', '20px'];
        let currentFontSizeIndex = 2;
        this.container.querySelector('.fonte-legenda').addEventListener('click', () => {
          currentFontSizeIndex = (currentFontSizeIndex + 1) % fontSizes.length;
          this.subtitleElement.style.fontSize = fontSizes[currentFontSizeIndex];
        });
    }
}