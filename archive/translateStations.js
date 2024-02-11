async function getNomenclatures() {
    const response = await axios.get('https://tickets.bdz.bg/portal/api/Nomenclatures/GetNomenclatures');
    return response.data;
  }
  
  function romanizeBulgarian(text) {
    const bulgarianToRoman = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ж: 'zh',
      з: 'z',
      и: 'i',
      й: 'j',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'o',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'h',
      ц: 'c',
      ч: 'ch',
      ш: 'sh',
      щ: 'sht',
      ъ: 'a',
      ь: 'j',
      ю: 'ju',
      я: 'ja',
      '.': '', // Remove dots
    };
  
    var words = text
      .replace(/[-\s.]+/g, '-') // Replace multiple spaces, dots, and dashes with a single dash
      .split('-');
  
    words = words.map(word => {
      // Special case: if the word is "СП.", convert it to "st"
      console.log(word);
      if (word.toLowerCase() === 'сп') {
        return 'st';
      }
  
      return word
        .toLowerCase()
        .split('')
        .map(char => bulgarianToRoman[char] || char)
        .join('');
    });
  
    // Remove the trailing dash if it exists
    words = words.join('-').replace(/-$/, '');
  
    return words;
  }
  
  function translateStations(nomenclatures) {
    let result = [];
    let current = {};
  
    nomenclatures.stations.forEach(st => {
      current = {
        id: st.id,
        name: st.name,
        romanizedName: romanizeBulgarian(st.name),
      };
      result.push(current);
    });
  
    return result;
  }