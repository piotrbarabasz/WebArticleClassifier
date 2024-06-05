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
  let httpMock: HttpTestingController;
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PredictionService', ['predict']);

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

  it('should predict category for text input', () => {
    component.booleanSwitchValue = false;
    component.textInputValue = 'test text';

    const mockResponse = { prediction: '[1, 0, 1, 0, 1, 0]' };
    predictionServiceSpy.predict.and.returnValue(of(mockResponse));

    component.predictCategory();

    expect(predictionServiceSpy.predict).toHaveBeenCalledWith('test text');
    expect(component.catColorList).toEqual([component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor]);
  });

  it('should predict category for file input', () => {
    component.booleanSwitchValue = true;
    component.fileContent = 'test content';

    const mockResponse = { prediction: '[0, 1, 0, 1, 0, 1]' };
    predictionServiceSpy.predict.and.returnValue(of(mockResponse));

    component.predictCategory();

    expect(predictionServiceSpy.predict).toHaveBeenCalledWith('test content');
    expect(component.catColorList).toEqual([component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor, component.notActiveColor, component.activeColor]);
  });
});
