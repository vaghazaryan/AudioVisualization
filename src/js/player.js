(() =>
{
   let controls = ['action', 'stop', 'volume'];
   let actions = {
       action: function (event, selector) {
           let icon = selector.firstElementChild;
           icon.classList.toggle("i-play");
           icon.classList.toggle("i-pause");
           if(icon.classList.contains("i-pause")){
               audio.play();
               let trace = document.querySelector('#trace');
               trace.max = Math.floor(audio.buffer.duration);
               trace.addEventListener('change', function (e) {
                   audio.jump(e.target.value);
               })
           }else{
               audio.pause();
           }
       },
       stop: function () {
           let actionButton = document.querySelector('.action');
           actionButton.firstElementChild.classList.remove('i-pause');
           actionButton.firstElementChild.classList.add('i-play');
           audio.stop();
       }
   };

   controls.forEach(control => {
       let selector = document.querySelector('.' + control);
       if(!selector) return;
       selector.addEventListener('click', e => actions[control](e, selector));
   });

})();