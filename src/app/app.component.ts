import { Component } from '@angular/core';
import { PredictionService } from './prediction.service';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = "docu2"

  notActiveColor = "#3d3d3d";
  activeColor = "#2ECC71";

  cat1Color = this.notActiveColor;
  cat2Color = this.notActiveColor;
  cat3Color = this.notActiveColor;
  cat4Color = this.notActiveColor;
  cat5Color = this.notActiveColor;
  cat6Color = this.notActiveColor;

  catColorList = [this.cat1Color, this.cat2Color, this.cat3Color, this.cat4Color, this.cat5Color, this.cat6Color]

  file: any;
  fileContent!: string;
  booleanSwitchValue: boolean = false;
  textInputValue: string = '';
  prediction: any;

  constructor(private predictionService: PredictionService) { }

  onSwitchChange() {
    console.log('Boolean Switch Value:', this.booleanSwitchValue);
  }

  onFileChange(event: any) {
    this.file = event.target.files[0];
    this.readFileContent(this.file)
    console.log('File content:', this.fileContent);
  }

  private readFileContent(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fileContent = e.target.result;
      console.log('File content1:', this.fileContent);
    };
    reader.readAsText(file);
  }

  public predictCategory(): void {
    console.log(this.file)
    if (this.booleanSwitchValue) {
      this.predictionService.predict(this.fileContent).subscribe(
        (response) => {
          console.log('Response:', response);
          const numberArray: number[] = JSON.parse(response.prediction);
          for (let i = 0; i < numberArray.length; i++) {
            if (numberArray[i] == 1) {
              this.catColorList[i] = this.activeColor;
            } else {
              this.catColorList[i] = this.notActiveColor;
            }
          }
        },
        (error) => {
          console.error('Error:', error);
        }
      );
    } else {
      this.predictionService.predict(this.textInputValue).subscribe(
        (response) => {
          console.log('Response:', response);
          const numberArray: number[] = JSON.parse(response.prediction);
          for (let i = 0; i < numberArray.length; i++) {
            if (numberArray[i] == 1) {
              this.catColorList[i] = this.activeColor;
            } else {
              this.catColorList[i] = this.notActiveColor;
            }
          }
        },
        (error) => {
          console.error('Error:', error);
        }
      );
    }
  }
}

