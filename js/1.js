const arrSlides = [
    {
        id: 1,
        name: 'Слайд 1',
        description: 'Перший слайд - красивий і простий!'
    },
    {
        id: 1,
        name: 'Слайд 2',
        description: 'Другий слайд - з плавними переходами!'
    },
    {
        id: 1,
        name: 'Слайд 3',
        description: 'Третій слайд - з автоматичним прокручуванням!'
    },
    {
        id: 1,
        name: 'Слайд 4',
        description: 'Четвертий слайд - підтримує клавіатуру!'
    },
    {
        id: 1,
        name: 'Слайд 5',
        description: "П'ятий слайд - працює на всіх пристроях!"
    },
]

class Slider {
    constructor(container, options = {}) {
        this.container = container;
        this.slidesElements = this.container.querySelectorAll('.slide');
        this.totalSlides = this.slidesElements.length; // кількість слайдів
        this.timeTransition = 2;


        this.config = {
            autoplay: false,
            duration: 4000,
            ...this.getDataConfig(), // додає налаштування з функції getDataConfig() (можливо, читає їх з data-* атрибутів контейнера)
            ...options // додає/перезаписує налаштування, які передав користувач
        }

        this.currentSlide = 0; //номер поточного слайду (починаємо з 0).
        this.isPlaying = this.config.autoplay;
        this.autoTimer = null;
        this.progressTimer = null;

        this.slides = this.container.querySelector('#slides');
        this.slidesAll = document.querySelectorAll('#slides .slide');
        this.indicators = this.container.querySelector('#indicators');
        this.progress = this.container.querySelector('.progress');
        this.playText = this.container.querySelector('#playText');

        if (!this.slides || !this.totalSlides) {
            console.error('No slides found');
            return;
        }

        this.init();
    }

    getDataConfig() {
        const config = this.container.getAttribute('data-slider-config');
        try {
            return config ? JSON.parse(config) : {};

        } catch (error) {
            console.error('Error parsing data-slider-config');
            return {};
        }

        /* Цей метод читає налаштування слайдера прямо з HTML через атрибут data-slider-config

        Якщо config існує, ми пробуємо перетворити його з JSON-рядка в об'єкт за допомогою JSON.parse(config). Якщо рядок пустий (config немає), повертаємо порожній об'єкт {}. Якщо JSON некоректний і парсинг не вдасться, ловимо помилку і виводимо її в консоль, а метод повертає {}.

        Таким чином, цей метод дає змогу зручно задавати налаштування слайдера прямо в HTML, які потім об'єднуються з дефолтними і переданими через options. */
    }

    init() {
        this.createIndicators();
        this.bindEvents();
        this.updateSlide();
        if (this.isPlaying) this.startAutoPlay();
        this.updatePlayButton();

        /* Цей метод - це стартова ініціалізація слайдера. Він викликається в конструкторі після всіх перевірок. Метод init() — це як «пускова кнопка» слайдера: він створює індикатори, підключає управління, показує стартовий слайд, запускає автоплей (якщо потрібно) і налаштовує кнопку керування.*/
    }

    createIndicators() {
        if (!this.indicators) return;
        this.indicators.innerHTML = '';
        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            indicator.setAttribute('data-slide', i);
            indicator.addEventListener('click', () => this.goToSlide(i));
            this.indicators.appendChild(indicator);
        }

        /* Цей метод відповідає за створення кнопок-індикаторів. У результаті:
        - Якщо у нас 5 слайдів, метод створить 5 кнопок.
        - Кожна кнопка відповідає своєму слайду і по кліку перемикає слайдер. */
    }

    goToSlide(index) {
        this.currentSlide = index; // Встановлює номер поточного слайду. index приходить із параметра (коли користувач клікнув по індикатору з data-slide="2", викликається goToSlide(2))
        this.updateSlide();
        this.resetAutoPlay();

        /* Цей метод — це якраз той механізм, який викликається при кліку на індикатор. Він змінює поточний слайд і оновлює слайдер. */
    }

    prevSlide() {
        this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
        this.updateSlide();
        this.resetAutoPlay();

        /* Метод робить так, що при виклику prevSlide() ми завжди переходимо на попередній слайд, і якщо були на першому – то «перемотує» на останній. */
    }

    nextSlide() {
        this.currentSlide = this.currentSlide === this.totalSlides - 1 ? 0 : this.currentSlide + 1;
        this.updateSlide();
        this.resetAutoPlay();

        /* Цей метод nextSlide() робить протилежне до prevSlide() – переходить на наступний слайд. */
    }

    updatePlayButton() {
        if (this.playText) {
            this.playText.textContent = this.isPlaying ? 'Pause' : 'Play';
        }

        /* Метод updatePlayButton() відповідає за оновлення тексту на кнопці відтворення/пауза слайдера. */
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) this.startAutoPlay();
        else this.stopAutoPlay();
        this.updatePlayButton();

        /* Коли ми викликаємо togglePlay(), спершу змінюємо стан слайдера: якщо він зараз грає (isPlaying = true), ми ставимо на паузу, а якщо він на паузі (isPlaying = false), запускаємо автопрогравання. Потім метод перевіряє новий стан: якщо слайдер тепер грає, запускається функція автопрогравання startAutoPlay(), а якщо на паузі — зупиняється через stopAutoPlay(). І нарешті метод оновлює текст кнопки через updatePlayButton(), щоб користувач бачив «Play», якщо слайдер на паузі, або «Pause», якщо він грає. */
    }

    bindEvents() {
        this.container.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            switch (action) {
                case 'prev': this.prevSlide(); break;
                case 'next': this.nextSlide(); break;
                case 'toggle': this.togglePlay(); break;

                // Залежно від значення action викликаємо відповідний метод: 'prev' → переходимо на попередній слайд. 'next' → переходимо на наступний слайд. 'toggle' → перемикаємо автопрогравання (Play/Pause).
            }
        });

        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowLeft': this.prevSlide(); break;
                case 'ArrowRight': this.nextSlide(); break;
                case ' ': event.preventDefault(); this.togglePlay(); break;

                // Перевіряємо, яку клавішу натиснули: 'ArrowLeft' → попередній слайд. 'ArrowRight' → наступний слайд. ' ' (пробіл) → перемикаємо Play/Pause; event.preventDefault() запобігає прокручуванню сторінки при пробілі.
            }
        });

        /* Метод bindEvents() відповідає за прив’язку всіх дій користувача до слайдера.
        
        Він робить дві речі:
        1. Кліки по кнопках всередині контейнера слайдера (prev, next, toggle) запускають відповідні методи слайдера.
        2. Натискання клавіш на клавіатурі (ArrowLeft, ArrowRight, пробіл) також дозволяють перемикати слайди або Play/Pause.
        
        Таким чином користувач може керувати слайдером як мишею, так і клавіатурою, а всі дії автоматично запускають оновлення слайдів та стан кнопки Play/Pause. */
    }

    updateSlide() {
        this.slidesAll.forEach(el => {
            el.classList.remove('active');
            el.style.transition = `${this.timeTransition}s`;
        });

        this.slidesAll[this.currentSlide].classList.add('active');
        this.slidesAll[this.currentSlide].style.transition = `${this.timeTransition}s`;

        if (this.indicators) {
            const indicators = this.indicators.querySelectorAll('.indicator');
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === this.currentSlide);
            });
            /* Перевіряємо, чи є індикатори слайдів (маленькі кружечки внизу слайдера). Проходимося по всіх індикаторах. Додаємо клас 'active' тому індикатору, який відповідає поточному слайду (index === this.currentSlide). Інші індикатори позбавляються класу 'active'. */
        }

        /* Метод updateSlide() відповідає за оновлення відображення слайдера.
        
        Він робить дві основні речі:
        1. Зсув слайдів: контейнер зі слайдами переміщується горизонтально, щоб показати поточний слайд.
        2. Оновлення індикаторів: маленькі кружечки під слайдером показують, який слайд активний, додаючи клас 'active' відповідному індикатору.
        
        Таким чином, коли ми викликаємо updateSlide(), користувач завжди бачить правильний слайд і актуальний стан індикаторів. */
    }

    startProgressBar() {
        if (!this.progress) return;

        let startTime = Date.now();

        const updateProgress = () => {
            if (!this.isPlaying) return;

            const elapsed = Date.now() - startTime;
            const progressPercent = (elapsed / this.config.duration) * 100;

            if (progressPercent >= 100) {
                this.progress.style.width = '100%';
                startTime = Date.now();
            } else {
                this.progress.style.width = `${progressPercent}%`;
                /* Якщо прогрес досяг 100%:
                    - Встановлюємо ширину прогрес-бара на 100%.
                    - Скидаємо startTime для наступного циклу (слайд оновиться).
                   Інакше просто оновлюємо ширину відповідно до відсотка. */
            }

            this.progressTimer = requestAnimationFrame(updateProgress); // Викликаємо функцію повторно на наступному кадрі, щоб анімація прогресу була плавною.
        };

        this.progressTimer = requestAnimationFrame(updateProgress); // Початковий запуск циклу оновлення прогресу.

        /* Коли ми викликаємо startProgressBar(), спершу перевіряємо, чи існує елемент прогрес-бара, і якщо його немає — нічого не робимо. Потім запам’ятовуємо момент початку відліку часу в змінній startTime. Далі створюється функція updateProgress, яка постійно оновлює ширину прогрес-бара: спершу перевіряє, чи слайдер зараз грає (isPlaying = true), і якщо ні — припиняє оновлення. Потім обчислюється, скільки часу пройшло від початку поточного слайду (elapsed) і який це відсоток від загальної тривалості слайду (progressPercent). Якщо прогрес досягає 100%, ширина прогрес-бара встановлюється на 100% і відлік часу скидається для наступного циклу; якщо ні — ширина встановлюється відповідно до обчисленого відсотка. І нарешті, функція сама викликає себе через requestAnimationFrame, щоб анімація була плавною та постійно оновлювалась. Таким чином користувач бачить, скільки часу залишилося до наступного слайду, а прогрес-бара синхронізується з автопрограванням слайдера. */
    }

    stopProgressBar() {
        if (this.progressTimer) cancelAnimationFrame(this.progressTimer);
        this.progressTimer = null;
        if (this.progress) this.progress.style.width = '0%';

        /* Коли ми викликаємо stopProgressBar(), спершу перевіряємо, чи існує таймер анімації прогрес-бара (progressTimer), і якщо він є — зупиняємо його за допомогою cancelAnimationFrame(). Потім скидаємо значення progressTimer на null, щоб позначити, що анімація більше не виконується. І нарешті перевіряємо, чи існує елемент прогрес-бара (progress), і якщо він є — встановлюємо його ширину на '0%', щоб прогрес виглядав порожнім. Таким чином метод повністю зупиняє анімацію прогрес-бара і очищає його відображення. */
    }

    startAutoPlay() {
        this.autoTimer = setInterval(() => {
            this.nextSlide();
        }, this.config.duration);

        this.progress.style.boxShadow = '4px 0px 10px 3px #9b9b9b';
        this.startProgressBar();

        /* Коли ми викликаємо startAutoPlay(), спершу перевіряємо, чи увімкнено автопрогравання в конфігурації (this.config.autoplay), і якщо ні — метод нічого не робить. Потім запускаємо таймер setInterval, який через кожен проміжок часу, заданий у this.config.duration, викликає метод nextSlide(), щоб автоматично переходити до наступного слайду. І нарешті запускаємо метод startProgressBar(), щоб синхронізувати анімацію прогрес-бара з автопрограванням слайдера. Таким чином слайдер автоматично перемикає слайди через задані проміжки часу, а користувач бачить, скільки часу залишилося до наступного слайду. */
    }

    stopAutoPlay() {
        if (this.autoTimer) clearInterval(this.autoTimer);
        this.autoTimer = null;
        this.progress.style.boxShadow = '';
        this.stopProgressBar();

        /* Коли ми викликаємо stopAutoPlay(), спершу перевіряємо, чи існує таймер автопрогравання (autoTimer), і якщо він є — зупиняємо його за допомогою clearInterval(). Потім скидаємо значення autoTimer на null, щоб позначити, що автопрогравання більше не виконується. І нарешті викликаємо метод stopProgressBar(), щоб зупинити анімацію прогрес-бара і очистити його відображення. Таким чином слайдер повністю зупиняє автопрогравання і синхронно очищає прогрес-бара. */
    }

    resetAutoPlay() {
        if (this.isPlaying) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }

        /* Коли ми викликаємо resetAutoPlay(), спершу перевіряємо, чи слайдер зараз грає (isPlaying = true). Якщо він на паузі — метод нічого не робить. Якщо слайдер грає, ми спершу зупиняємо автопрогравання за допомогою stopAutoPlay(), щоб скинути таймер і прогрес-бар, а потім одразу запускаємо його знову через startAutoPlay(). Таким чином автопрогравання і прогрес-бар перезапускаються, і відлік часу для поточного слайду починається спочатку. */
    }
}

class TuchSlider extends Slider {
    constructor(container, options = {}) {
        super(container, options);
        this.xMouse = null;
        this.yMouse = null;

        this.xDown = null;
        this.yDown = null;

        this.container.addEventListener("mousedown", this.handleMouseStart.bind(this), false);
        this.container.addEventListener("mousemove", this.handleMouseMove.bind(this), false);

        this.container.addEventListener("touchstart", this.handleTouchStart.bind(this), false);
        this.container.addEventListener("touchmove", this.handleTouchMove.bind(this), false);
    }

    handleMouseStart(event) {
        this.xMouse = event.offsetX;
        this.yMouse = event.offsetY;
    }

    handleMouseMove(event) {
        if (this.xMouse === null || this.yMouse === null) return;

        const xDiff = this.xMouse - event.offsetX;
        const yDiff = this.yMouse - event.offsetY;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }

        this.xMouse = null;
        this.yMouse = null;
    }

    handleTouchStart(event) {
        const firstTouch = event.touches[0];
        const clientX = firstTouch.clientX;
        const clientY = firstTouch.clientY;

        this.xDown = clientX;
        this.yDown = clientY;
    }

    handleTouchMove(event) {
        if (!this.xDown || !this.yDown) return;

        const firstTouch = event.touches[0];
        const clientX = firstTouch.clientX;
        const clientY = firstTouch.clientY;

        const xDiff = this.xDown - clientX;
        const yDiff = this.yDown - clientY;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }

        this.xDown = null;
        this.yDown = null;
    }
}

class CreateSlider extends TuchSlider {
    constructor(container, options) {
        super(container, options);
        this.init();
    }

    init() {
        this.createSlide();
        super.init();
    }

    createSlide() {
        const mySlide = arrSlides.map((slide, index) =>
            `<div class="slide ${index === 0 ? 'active' : ''}">
                <div class="slide-content">
                    <h2>${slide.name}</h2>
                    <p>${slide.description}</p>
                </div>
            </div>`).join('');

        this.slides.innerHTML = mySlide;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        new CreateSlider(sliderContainer);
    }

    /* Коли сторінка повністю завантажується (DOMContentLoaded), спершу шукаємо на сторінці елемент з класом .slider-container. Якщо такий елемент існує, створюємо новий екземпляр класу Slider, передаючи йому знайдений контейнер. Таким чином, слайдер ініціалізується лише після повного завантаження DOM, і всі його методи та події (кліки, клавіші, автопрогравання, прогрес-бар) починають працювати для конкретного контейнера на сторінці. */
});