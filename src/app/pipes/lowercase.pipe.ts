import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lowerCase'
})
export class LowerCasePipe implements PipeTransform {
  transform(value: string): string {
    return lowerCase(value);
  }
}

export const lowerCase = (value:string) => {
    if (!value) {
      return '';
    }
    return value.toLowerCase();
}