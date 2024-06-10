import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { PredictionService } from './prediction.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let predictionServiceSpy: jasmine.SpyObj<PredictionService>;
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PredictionService', ['predict', 'predict_pl']);

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, HttpClientTestingModule, MatSlideToggleModule, FormsModule, BrowserAnimationsModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [{ provide: PredictionService, useValue: spy }]
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    predictionServiceSpy = TestBed.inject(PredictionService) as jasmine.SpyObj<PredictionService>;

  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should handle switch change', () => {
    component.onSwitchChange();
    expect(component.booleanSwitchValue).toBe(false);
  });

  it('should handle file change', fakeAsync(() => {
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [testFile] } } as any;

    component.onFileChange(event);
    fixture.whenStable().then(() => {
      expect(component.file).toEqual(testFile);
    });
  }));

  it('should predict category for text input in English', () => {
    component.booleanSwitchValue = false;
    component.textInputValue = 'test text';
    component.selectedLanguage = 'en';

    const mockResponse = { predictions: [1, 0, 1, 0, 1, 0] };
    predictionServiceSpy.predict.and.returnValue(of(mockResponse));

    component.predictCategory();

    expect(predictionServiceSpy.predict).toHaveBeenCalledWith('test text');
    expect(component.catColorList).toEqual([component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor]);
  });

  it('should predict category for text input in Polish', () => {
    component.booleanSwitchValue = false;
    component.textInputValue = 'test text';
    component.selectedLanguage = 'pl';

    const mockResponse = { predictions: [0, 1, 0, 1, 0, 1] };
    predictionServiceSpy.predict_pl.and.returnValue(of(mockResponse));

    component.predictCategory();

    expect(predictionServiceSpy.predict_pl).toHaveBeenCalledWith('test text');
    expect(component.catColorList).toEqual([component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor]);
  });

  it('should predict category for file input in English', () => {
    component.booleanSwitchValue = true;
    component.fileContent = 'test content';
    component.selectedLanguage = 'en';

    const mockResponse = { predictions: [0, 1, 0, 1, 0, 1] };
    predictionServiceSpy.predict.and.returnValue(of(mockResponse));

    component.predictCategory();

    expect(predictionServiceSpy.predict).toHaveBeenCalledWith('test content');
    expect(component.catColorList).toEqual([component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor]);
  });

  it('should predict category for file input in Polish', () => {
    component.booleanSwitchValue = true;
    component.fileContent = 'test content';
    component.selectedLanguage = 'pl';

    const mockResponse = { predictions: [1, 0, 1, 0, 1, 0] };
    predictionServiceSpy.predict_pl.and.returnValue(of(mockResponse));

    component.predictCategory();

    expect(predictionServiceSpy.predict_pl).toHaveBeenCalledWith('test content');
    expect(component.catColorList).toEqual([component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor]);
  });
});
