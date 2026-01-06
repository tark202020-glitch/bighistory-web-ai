export const BOOK_TITLES: { [key: string]: string } = {
    '01': '세상은 어떻게 시작되었을까?',
    '02': '우주의 탄생과 빅뱅',
    '03': '별과 원소의 탄생',
    '04': '태양계와 지구의 탄생',
    '05': '생명의 탄생과 진화',
    '06': '인류의 등장',
    '07': '농경의 시작과 문명',
    '08': '초기 문명과 국가',
    '09': '실크로드와 교류',
    '10': '근대 세계의 형성',
    '11': '산업혁명과 자본주의',
    '12': '현대 사회의 과제',
    '13': '미래 사회의 전망',
    '14': '빅히스토리의 관점',
    '15': '우주와 나',
    '16': '생태계와 환경',
    '17': '과학과 기술의 발전',
    '18': '문화와 예술',
    '19': '전쟁과 평화',
    '20': '지속 가능한 미래',
    '21': '빅히스토리 | 조지형 옮김'
};

export const getBookTitle = (filename: string): string => {
    // Extract number from filename (e.g., "01-Main.pdf" -> "01")
    const match = filename.match(/^(\d+)/);
    if (match && match[1]) {
        return BOOK_TITLES[match[1]] || `Big History Book ${match[1]}`;
    }
    return filename;
};
