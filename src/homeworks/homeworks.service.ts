import { Injectable } from '@nestjs/common';
import axios from 'axios';
import got from 'got';
@Injectable()
export class HomeworkService {
  async axiosFetchData() {
    const maxRetries = 3;

    for (let retries = 1; retries <= maxRetries; retries++) {
      try {
        const response = await axios.get('https://www.naver.com');
        //console.log(response.data);
        return; // 성공 시 종료
      } catch (error) {
        console.error('Error:', error.message);

        if (retries < maxRetries) {
          console.log(`Retrying... Attempt ${retries + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기 후 재시도
        } else {
          console.error(`Failed after ${maxRetries} retries`);
        }
      }
    }
  }

  async gotFetchData() {
    try {
      await got
        .get('http://localhost:3000/', {
          retry: {
            limit: 5,
            calculateDelay: ({ computedValue }) => {
              console.log(computedValue);
              if (computedValue) {
                return 1000;
              }
              return 0;
            },
          },
        })
        .then(response => {
          //console.log(response.body);
        })
        .catch(error => {});
    } catch (e) {
      console.log(e);
    }
  }
}
