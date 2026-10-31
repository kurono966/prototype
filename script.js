document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'image-dialog';
    dialog.setAttribute('aria-label', '作品の拡大表示');
    const close = document.createElement('button');
    close.className = 'dialog-close';
    close.type = 'button';
    close.textContent = '閉じる ×';
    const enlarged = document.createElement('img');
    const caption = document.createElement('p');
    dialog.append(close, enlarged, caption);
    document.body.append(dialog);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
    document.querySelectorAll('.image-card').forEach(card => {
        const img = card.querySelector('img');
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `${img.alt}を拡大`);
        img.before(button);
        button.append(img);
        button.addEventListener('click', () => {
            enlarged.src = img.src;
            enlarged.alt = img.alt;
            caption.textContent = card.querySelector('figcaption').textContent;
            dialog.showModal();
        });
    });
    document.querySelectorAll('audio').forEach(audio => {
        audio.addEventListener('play', () => {
            document.querySelectorAll('audio').forEach(other => {
                if (other !== audio) other.pause();
            });
        });
    });
});
