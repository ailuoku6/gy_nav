import jsonp from 'jsonp';
import { SUGTIP } from '../../utils/Api';
import { debounceTime, Subject, switchMap } from 'rxjs';

export const jsonpWithPromise = (keyword: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (!keyword) {
        resolve([]);
    }
    try {
      jsonp(
        SUGTIP + keyword,
        {
          param: 'cb',
        },
        (_err: any, data: any) => {
          const fetchSug = data?.s || [];
          resolve(fetchSug);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

export const sugSubject = new Subject<string>();

export const sugObservable = sugSubject.pipe(
  debounceTime(200),
  switchMap((keyword) => jsonpWithPromise(keyword))
);

