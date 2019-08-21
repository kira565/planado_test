const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');


let commentArray = [];
app();


function app() {
    const files = getFiles();
    files.forEach(commArr => {
        let currentPath = findPath(commArr);
        findComments(commArr).forEach(el => {
            commentArray.push(el + ' ; ' + currentPath);
        })
    });
    console.log('Please, write your command!');
    readLine(processCommand);
}

function makeToDoList(commArr) { // Формируем список объектов TODO
    const toDoList = [];
    commArr.forEach(el => {
        const splitedEl = el.split(';');

        if (splitedEl.length === 2) { // ТОТ СЛУЧАЙ, КОГДА TODO представлен обычноым текстом
            splitedEl[0].split(' ');
            toDoList.push({
                important: splitedEl[0].match(/!+/g) !== null ? splitedEl[0].match(/!+/g)[0] : '',
                user: '',
                date: '',
                text: splitedEl[0].slice(splitedEl[0].indexOf("TODO") + 4).trim(),
                fileName: splitedEl[1].trim()
            })
        }
        else if (splitedEl.length === 4) { // ТОТ СЛУЧАЙ, КОГДА TODO имеет структуру {Имя автора}; {Дата комментария}; {Текст комментария}
            toDoList.push({
                important: splitedEl[2].match(/!+/g) !== null ? splitedEl[2].match(/!+/g)[0] : '',
                user: splitedEl[0].slice(splitedEl[0].indexOf("TODO") + 4).trim(),
                date: splitedEl[1].trim(),
                text: splitedEl[2].trim(),
                fileName: splitedEl[3].trim()
            })
        }
    });
    return toDoList
}

function findComments(str) { // ПОИСК TODO
    let re1 = /\/\/\s*TODO[^\n\rC:\/\/]+/ig;
    return str.match(re1)
}

function findPath(str) { // ПОИСК ДИРЕКТОРИИ
    let rePath = /\/([A-z0-9-_+]+)\.js/i;
    let result = str.match(rePath);
    return result[0].slice(result[0].indexOf('/') + 1);
}

function getFiles() { // Получение файлов
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js'); //PATHS
    return filePaths.map(path => readFile(path) + ' ' + path);
}

function processCommand(command) { // Обработка команд
    const list = makeToDoList(commentArray);
    switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            toTable(list);
            break;
        case 'important':
            toTable(filter('important', list));
            break;
        case 'user' + ' ' + command.split(' ')[1]:
            let username = command.split(' ')[1];
            toTable(filter('user', list, username));
            break;
        case 'date' + ' ' + command.split(' ')[1]:
            let date = command.split(' ')[1];
            toTable(filter('date', list, date));
            break;
        case 'sort' + ' ' + command.split(' ')[1]:
            let sortBy = command.split(' ')[1];
            switch (sortBy) {
                case 'importance':
                    toTable(sort(sortBy, list));
                    break;
                case 'user':
                    toTable(sort(sortBy, list));
                    break;
                case 'date':
                    toTable(sort(sortBy, list));
                    break;
                default:
                    console.log('wrong sort parameter')
            }
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function filter(by, list, param) { // Фильтрации
    switch (by) {
        case 'user':
            let resultUserArr = [];
            let re = new RegExp('^' + param, 'i');
            list.map(elem => {
                if (elem.user.search(re) > -1) {
                    resultUserArr.push(elem)
                }
            });
            return resultUserArr;
        case 'date':
            let wrongFormat = 'wrong date format';
            let re1 = /^\d{4}$/;
            let re2 = /^\d{4}-\d{2}$/;
            let re3 = /^\d{4}-\d{2}-\d{2}$/;

            if (re1.test(param)) {
                let dateParam = new Date(param);
                return filterDateFormat(dateParam, list, /\d{4}/)
            } else if (re2.test(param)) {
                let dateParam = new Date(param);
                return filterDateFormat(dateParam, list, /\d{4}-\d{2}/)
            } else if (re3.test(param)) {
                let dateParam = new Date(param);
                return filterDateFormat(dateParam, list, /\d{4}-\d{2}-\d{2}/)
            } else {
                console.log(wrongFormat);
                return [];
            }

        function filterDateFormat(dateParam, list, regexp) {
            let resultDateArr = [];
            list.map(elem => {
                if (elem.date !== '') {
                    let dateElem = new Date(elem.date.match(regexp)[0]);
                    if (dateElem >= dateParam) {
                        resultDateArr.push(elem)
                    }
                }
            });
            return resultDateArr;
        }
        case "important":
            let importantDateArr = [];
            list.map(elem => {
                if (elem.important !== '') {
                    importantDateArr.push(elem)
                }
            });
            return importantDateArr
    }
}

function sort(by, list) { // Сортировка
    list.sort(function (commentA, commentB) {
        switch (by) {
            case 'importance':
                if (commentA.important.length > commentB.important.length) {
                    return -1;
                }
                if (commentA.important.length < commentB.important.length) {
                    return 1;
                }
                return 0;
            case 'user':
                if (commentA.user !== '') return -1;
                if (commentB.user !== '') return 1;
                return 0;
            case 'date':
                let a = commentA.date !== '' && new Date(commentA.date);
                let b = commentB.date !== '' && new Date(commentB.date);
                if (a > b) {
                    return -1;
                }
                if (a < b) {
                    return 1;
                }
                return 0;
        }
    });
    return list
}

//РАЗМЕТКА ТАБЛИЦЫ
function toTable(list) {
    let header = {
        important: '!',
        user: 'user',
        date: 'date',
        text: 'comment',
        fileName: 'fileName'
    };
    list.unshift(header);

    let counter = getBiggestLengthsOfColumns(list);
    let line = '';
    let length = 0;
    for (let i = 0; i < counter.length; i++) {
        length = length + counter[i];
    }
    for (let i = 0; i < length + 4 * 5 + 6; i++) {
        line = line + '-'
    }


    for (let i = 0; i < list.length; i++) {
        let row = [list[i].important ? '!' : '', list[i].user, list[i].date, list[i].text, list[i].fileName];
        let printingRow = completeRow(row, counter);

        console.log(
            '  |  ' + printingRow[0] +
            '  |  ' + printingRow[1] +
            '  |  ' + printingRow[2] +
            '  |  ' + printingRow[3] +
            '  |  ' + printingRow[4] + '  |  ');
        if (i === 0) {
            console.log('  ' + line)
        }
        if (i === list.length - 1) {
            console.log('  ' + line)
        }
    }

    function getBiggestLengthsOfColumns(list) {
        let maxLength = [1, 10, 15, 150, 15];
        let counters = [0, 0, 0, 0, 0];
        list.forEach(elem => { //ищем здесь максимальные размеры колонок
            let row = [elem.important ? '!' : '', elem.user, elem.date, elem.text, elem.fileName];
            for (let i = 0; i < row.length; i++) {
                if (row[i] !== '') {
                    if (row[i].length < maxLength[i]) {
                        if (row[i].length > counters[i]) {
                            counters[i] = row[i].length
                        }
                    } else {
                        counters[i] = maxLength[i];
                    }
                }
            }
        });
        return counters
    }

    function completeRow(row, columnLength) {
        let carvedRow = cutRow(row, columnLength);


        function cutRow(row, columnLength) {
            let cutResultRow = [];
            let spread = '...';
            for (let i = 0; i < row.length; i++) {
                if (row[i].length > columnLength[i]) {
                    let diff = row[i].length - columnLength[i];
                    cutResultRow.push(row[i].substr(0, row[i].length - (diff + spread.length)) + spread)
                }
                else cutResultRow.push(row[i])
            }
            return cutResultRow;
        }

        function makeRow(carvedRow, columnLength) {
            let makedRow = [];
            for (let i = 0; i < carvedRow.length; i++) {
                if (carvedRow[i].length < columnLength[i]) {
                    let cell = '';
                    let rightSpace = '';
                    let diff = columnLength[i] - carvedRow[i].length;
                    for (let i = 0; i < diff; i++) {
                        rightSpace = rightSpace + ' '
                    }

                    if (carvedRow[i] === '') {
                        for (let i = 0; i < columnLength[i]; i++) {
                            cell = cell + ' ';
                        }
                    }

                    cell = carvedRow[i] + rightSpace;
                    makedRow.push(cell)
                } else if (carvedRow[i].length === columnLength[i]) {
                    makedRow.push(carvedRow[i])
                }
            }
            return makedRow;
        }

        return makeRow(carvedRow, columnLength);
    }
}

// TODO you can do it!
