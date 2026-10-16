(() => {
  const image = document.querySelector('.backdrop img');
  if (!image) return;
  const parts = ["assets/nano-eye/part-01.txt", "assets/nano-eye/part-02.txt", "assets/nano-eye/part-03.txt", "assets/nano-eye/part-04.txt", "assets/nano-eye/part-05.txt", "assets/nano-eye/part-06.txt", "assets/nano-eye/part-07.txt", "assets/nano-eye/part-08.txt", "assets/nano-eye/part-09.txt", "assets/nano-eye/part-10.txt", "assets/nano-eye/part-11.txt", "assets/nano-eye/part-12.txt", "assets/nano-eye/part-13.txt", "assets/nano-eye/part-14.txt", "assets/nano-eye/part-15.txt", "assets/nano-eye/part-16.txt", "assets/nano-eye/part-17.txt", "assets/nano-eye/part-18.txt", "assets/nano-eye/part-19.txt", "assets/nano-eye/part-20.txt", "assets/nano-eye/part-21.txt"];
  Promise.all(parts.map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Background asset unavailable: ' + response.status);
    return response.arrayBuffer();
  })).then(buffers => {
    const objectURL = URL.createObjectURL(new Blob(buffers, { type: 'image/svg+xml' }));
    image.addEventListener('load', () => URL.revokeObjectURL(objectURL), { once: true });
    image.src = objectURL;
  }).catch(error => console.error('Particula background:', error));
})();
