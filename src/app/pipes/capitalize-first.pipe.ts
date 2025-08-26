import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizeFirst'
})
export class CapitalizeFirstPipe implements PipeTransform {
  transform(value: string): string {
    return capitalizeFirst(value);
  }
}

export const capitalizeFirst = (value:string) => {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}