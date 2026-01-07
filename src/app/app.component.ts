import { Compiler, Component, NgModule, ViewContainerRef, inject, viewChild } from '@angular/core';
import { AiService } from './ai';
import { AIResponse, ComponentDefinition } from './models';
import { FormsModule } from '@angular/forms';
import { CommonModule, JsonPipe, NgIf } from '@angular/common';
import '@angular/compiler';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <input type="text" [(ngModel)]="prompt" />
      <button (click)="getAIResponse()">Get Response</button>
      <p *ngIf="response">{{ response | json }}</p>
    </div>
    <div>
      <h1>Preview</h1>
      <div>
        <ng-container #vcr/>
      </div>
    </div>
  `,
  imports: [FormsModule, NgIf, JsonPipe]
})
export class AppComponent {
  prompt: string = 'generate card component';
  response: string = '';
  vcr = viewChild.required<ViewContainerRef>("vcr")
  compiler = inject(Compiler)

  constructor(private aiService: AiService) {}

  getAIResponse() {
    this.response = ''
    this.aiService.streamGeminiResponse(this.prompt).subscribe((res) => {
      this.response += res;
      try {
      const json: AIResponse = JSON.parse(this.response)
      console.log(json)
      const JitComponent = this.getWrapper(json);

      console.log(JitComponent, this.components)
      } catch(e) {

      }
      
    });
  }
  cmpMap: any = {}
  components: ComponentDefinition[] = []
  toComponent(cmp: ComponentDefinition) {
    const clazz = Component({
      selector: cmp.selector,
      template: cmp.html,
      inputs: cmp.inputs.map((input) => input.name),
      imports: cmp.dependencies.map(dep => {
        if (dep.type === 'component') {
          if(!this.cmpMap[dep.key]) this.cmpMap[dep.key] = this.toComponent(this.components.find(c => c.selector == dep.key )!)
          return this.cmpMap[dep.key]
        }
      }),
      standalone: true
    })(class {})
    return clazz
  }

  getWrapper(response: AIResponse) {
    this.components = response.components
    const components = response.components.map(cmp => ({key: cmp.selector, clazz: this.toComponent(cmp)}))
    console.log({components})
  
    @Component({
      selector: 'root-wrapper',
      template: `testing`
    })
    class Root {}

    this.vcr().createComponent(Root)

    @NgModule({
      imports: [CommonModule, FormsModule, Root],
      exports: [CommonModule, FormsModule, Root]
    })
    class ContainerModule {}

    const factory = this.compiler.compileModuleAndAllComponentsSync(ContainerModule)
  
    console.log(factory)
    return Root;
  };
}
