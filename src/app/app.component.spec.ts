import { HttpClientModule } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { FileReaderService } from './service/fileReader.service';
import { By } from '@angular/platform-browser';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        FileReaderService
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Rabobank Customer Statement Processor');
  });

  it('should render info', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toContain('Choose a CSV / request a XML file and get the list of failed transactions');
  });

  it('should read csv', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(new File([''], '../assets/records.csv'))
    const inputDebugEl  = fixture.debugElement.query(By.css('input[type=file]'));
    inputDebugEl.nativeElement.files = dataTransfer.files;
    inputDebugEl.nativeElement.dispatchEvent(new InputEvent('change'));
    fixture.detectChanges();
    expect(component.fileLength).toBeGreaterThan(0);
  })

  it('file change event should arrive in handler', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    const element = fixture.nativeElement;
    const input = element.querySelector('#csvReader');
    spyOn(component, 'onHandleCSVFileSelect').and.callThrough();;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.onHandleCSVFileSelect).toHaveBeenCalled()
  });

  it('should call getCSVJsonArray with correct data', ()=> {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    let resultArray = {
      data: [{
        'Account Number': "NL69ABNA0433647324",
        'Description': "Flowers from Erik de Vries",
        'End Balance': "6.67",
        'Mutation': "-7.25",
        'Reference': "156108",
        'Start Balance': "13.92"
      }]
    }
    component.getCsvJsonArray(resultArray);
    expect(component.displayTable).toEqual(true);
  })

  it('should call getCSVJsonArray with incorrect data', ()=> {
    debugger
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    let resultArray = {
      data: [{
        'Account Number': "NL69ABNA0433647324",
        'Description': "Flowers from Erik de Vries",
        'End Balance': "6.67",
        'Mutation': "-7.25",
        'Start Balance': "13.92"
      }]
    }
    component.getCsvJsonArray(resultArray);
    expect(component.displayTable).toEqual(false);
  })

  it('testing subscribe method is getting called',fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    let xmlResponse = `<records>\n  <record reference="164702">\n    <accountNumber>NL46ABNA0625805417</accountNumber>\n    <description>Flowers for Rik Dekker</description>\n    <startBalance>81.89</startBalance>\n    <mutation>+5.99</mutation>\n    <endBalance>8.88</endBalance>\n  </record>\n</records>`
    const component = fixture.componentInstance;
    let fileReaderService = fixture.debugElement.injector.get(FileReaderService);
    let spy = spyOn(fileReaderService, 'getXMLInfo')
              .and.returnValue(of(xmlResponse));
    let subSpy = spyOn(fileReaderService.getXMLInfo(), 'subscribe');
    component.onHandleXMLFileSelect();
    tick();
    expect(spy).toHaveBeenCalledBefore(subSpy);
    expect(subSpy).toHaveBeenCalled();
  }))

  it('testing execution within handleXMLFileSelect subscribe method', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    let xmlResponse = `<records>\n  <record reference="164702">\n    <accountNumber>NL46ABNA0625805417</accountNumber>\n    <description>Flowers for Rik Dekker</description>\n    <startBalance>81.89</startBalance>\n    <mutation>+5.99</mutation>\n    <endBalance>8.88</endBalance>\n  </record>\n</records>`
    let fileReaderService = fixture.debugElement.injector.get(FileReaderService);
    let spy = spyOn(fileReaderService, 'getXMLInfo')
              .and.returnValue(of(xmlResponse));
    component.onHandleXMLFileSelect();
    tick();
    expect(component.filteredArr).toBeDefined();
    expect(component.filteredArr.length).toBeGreaterThan(0);
  }));

  it('should execute validateData with isReferenceNotUnique false and isEndBalanceNotCorrect true', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    const test = [{accountNum: "NL69ABNA0433647324",
        description: "Flowers from Erik de Vries",
        endBal: "10.67",
        mutation: "-7.25",
        reference: "156108",
        startBal: "13.92"
    },
    {
      accountNum: "NL93ABNA0585619023",
      description: "Subscription from Rik Theu�",
      endBal: "53.3",
      mutation: "-23.99",
      reference: "112806",
      startBal: "77.29",
    }
  ]
    const result = component.validateData(test);
    expect(result[0].reference).toEqual('156108');
  })

  it('should execute validateData with IsReferenceNotUnique true and isEndBalanceNotCorrect true', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    const test = [{accountNum: "NL69ABNA0433647324",
        description: "Flowers from Erik de Vries",
        endBal: "10.67",
        mutation: "-7.25",
        reference: "156108",
        startBal: "13.92"
    },
    {
      accountNum: "NL93ABNA0585619023",
      description: "Subscription from Rik Theu�",
      endBal: "53.3",
      mutation: "-23.99",
      reference: "112806",
      startBal: "77.29",
    },
    {accountNum: "NL69ABNA0433647324",
        description: "Flowers from Erik de Vries",
        endBal: "10.67",
        mutation: "-7.25",
        reference: "156108",
        startBal: "13.92"
    },
  ]
    const result = component.validateData(test);
    expect(result[0].reference).toEqual('156108');
  })
});
