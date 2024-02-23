<h1 align="center">
  BulTrain Server-side
  <br>
   <img src="./guide/images/bultrain-logo.jpg" alt="Logo BulTrain" title="Сървърен софтуер на приложението BulTrain" width="500"/>
  <br>
</h1>

<p align="center">
  Сървърен софтуер за извличане на полезна информация, свързана с железопътния транспорт в България. Той се използва от мобилното приложение BulTrain.
</p>

## Съдържание

  * [Какво представлява проектът?](#какво-представлява-проектът)
  * [Примерна употреба](#примерна-употреба)
    * [Заявка за извличане на разписание](#заявка-за-извличане-на-разписание)
    * [Заявка за извличане на електронното табло на избрана гара](#заявка-за-извличане-на-електронното-табло-на-избрана-гара)
    * [Заявка за извличане на информацията за влак по неговия номер](#заявка-за-извличане-на-информацията-за-влак-по-неговия-номер)
    * [Заявка за извличане на всички заглавия на теми и техните заглавни снимки от наръчника](#заявка-за-извличане-на-всички-заглавия-на-теми-и-техните-заглавни-снимки-от-наръчника)
    * [Заявка за извличане на цялото съдържание на една тема по нейния номер от наръчника](#заявка-за-извличане-на-цялото-съдържание-на-една-тема-по-нейния-номер-от-наръчника)
    * [Заявка за извличане на снимки](#заявка-за-извличане-на-снимки)
  * [Инсталация на проекта](#инсталация-на-проекта)
  * [Мобилно приложение](#мобилно-приложение)

## Какво представлява проектът?

Проектът представлява сървърният софтуер, който извлича информация за влаковото движение в България. Извличането се осъществява чрез заявки към програмно-приложен интерфейс (API). Видовете информация, която може да бъде извлечена е:
 * Разписание на влаковете между две гари
 * Електронно табло с пристигащите и заминаващи влакове на една гара
 * Информация за маршрута и разписанието на влак по неговия номер
 * Наръчник с теми, които отговарят на най-често задаваните въпроси с БДЖ.

Важно е да се отбележи, че този сървърен софтуер е отговорен за търсенето на информация **само за услугите, предлагани от Български Държавни Железници**! Езиците, на които може да бъде търсена информация за момента са **български и английски** език!

## Примерна употреба

Сървърният софтуер е достъпен на следния базов URL адрес:
`https://bultrain-backend-9e5d2178614e.herokuapp.com/`

Изпращането на заявка за извличане на информация трябва да се осъществи като към базовия URL адфрес се добавят параметрите за нужната функционалност. Всичките видове функционалности и тяхното извикване са представени в следващите точки:

### Заявка за извличане на разписание
Извличането на разписанието се осъществява като към базовия адрес се добави `api/schedule/`. След това трябва да следва езикът, с който да се търси разписанието, както и останалите параметри - код на начална гара, код на крайна гара, дата (по желание). Списъкът с кодовете на всички гари в България може да бъде открит във файла `stations.json`. Датата трябва да бъде в следния формат: `yyyy-mm-dd`.
<br><br>Примерна заявка за извличането на разписанието между гарите Антон и София за дата 13.02.2024 г. се дефинира по следния начин:

```
https://bultrain-backend-9e5d2178614e.herokuapp.com/api/schedule/bg/440/2/2024-02-13
```

### Заявка за извличане на електронното табло на избрана гара
Извличането на електронното табло на избрана гара се осъществява като към базовия адрес се добави `api/live/`. След това трябва да следва езикът, с който да се търси информация, както и останалите параметри - код на гарата, тип на влаковете, които се търсят (заминаващи или пристигащи - на английски език!).
<br><br>Примерна заявка за извличането на пристигащите влакове на гара Подуяне пътническа се дефинира по следния начин:

```
https://bultrain-backend-9e5d2178614e.herokuapp.com/api/live/bg/35/arrivals
```

### Заявка за извличане на информацията за влак по неговия номер
Извличането на маршрута и разписанието на избран влак по неговия номер се осъществява като към базовия адрес се добави `api/train-info/`. След това следва езикът, с който да се търси информацията, както и останалите параметри - номерът на влака, дата, за която да се търси информация (по желание). Датата може да бъде в следните формати: `yyyy-mm-dd` или `dd.mm.yyyy`.
<br><br>Примерна заявка за извличане на информацията за Пътнически влак №30123 за дата 13.02.2024 г. се дефинира по следния начин:

```
https://bultrain-backend-9e5d2178614e.herokuapp.com/api/train-info/bg/30123/13.02.2024
```

### Заявка за извличане на всички заглавия на теми и техните заглавни снимки от наръчника
Извличането на всички заглавия на теми и техните заглавни снимки от наръчника се осъществява с цел визуализирането на всяка тема. Заявката трябва да се осъществи като към базовия адрес се добави `api/guide/`. След това следва езикът, на който да бъде върнат отговор.
<br><br>Примерна заявка за извличане на всички заглавия на теми, заедно с техните заглавни снимки, на български език се дефинира по следния начин:

```
https://bultrain-backend-9e5d2178614e.herokuapp.com/api/guide/bg
```

### Заявка за извличане на цялото съдържание на една тема по нейния номер от наръчника
Заявката за извличане на конкретна тема от наръчника изглежда по същия начин, както предишната заявка, с разликата, че накрая трябва да се добави индексът на темата, която се търси.
<br><br>Примерната заявка за извличането на съдържанието на втората тема се дефинира по следния начин:

```
https://bultrain-backend-9e5d2178614e.herokuapp.com/api/guide/bg/1
```

### Заявка за извличане на снимки
Тъй като снимките трябва да бъдат извлечени по някакъв начин, то заявката за тяхното извличане се осъществява като към базовия адрес се добави `guide/images/`. След това следва името на снимката.
<br><br>Примерната заявка за извличането на заглавната снимка на първата тема изглежда по следния начин:

```
https://bultrain-backend-9e5d2178614e.herokuapp.com/guide/images/topic1.jpg
```


## Инсталация на проекта

Тази точка описва локалното инсталиране на проекта, което не е нужно за използването на услугите му. Въпреки това локалната инсталация на този сървърен софтуер може да бъде направена чрез клонирането на това GitHub репо. След това софтуерът трябва да бъде стартиран чрез използването на `yarn`.

``` bash
git clone https://github.com/tgarmenliev/diploma_project
yarn install
yarn start
```

След стартирането на проекта, в терминала се появява към кой порт трябва да се отправят заявките. В примера отдолу портът е `3001`.
Заявките към сървърния софтуер могат да бъдат отправяни към следния базов URL адрес: `http://localhost:3001/`

## Мобилно приложение
GitHub репото на мобилното приложение BulTrain, което предоставя полезна информация за железопътния транспорт в България, може да бъде достъпено [тук](https://github.com/tgarmenliev/vlak_app_test).