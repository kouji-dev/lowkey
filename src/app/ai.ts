import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Observable, from, of, concatMap, map, mergeMap } from 'rxjs';
import {environment} from '../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.AI_API_KEY);
  }

  streamGeminiResponse(prompt: string): Observable<string> {
    console.log('API')
    console.log(environment.AI_API_KEY)
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: {responseMimeType: 'application/json'} });

    // Convert the async generator to an Observable
    const responseObservable = from(model.generateContentStream({
      systemInstruction: `
        You are a low-code platform expert with Angular Components, you will generate code in the form of:
        
        interface ComponentDefinition {
          selector: string
          html: string // includes calls of another Component, it should contain all css styles
          inputs: InputDefinition[]
          dependencies: DependencyDefinition[]
      }
      
      interface InputDefinition {
          name: string
          type: string
      }
      
      interface DependencyDefinition {
          type: 'component'
          key: string //component selector
      }

      interface Response {
        rootComponent: string // selector of one of the components from the components list
        components: ComponentDefinition[]
      }
      
      return Response as JSON
      `,
      contents: [{role: "user", parts: [{text: prompt}]}],
      
    }));

    return responseObservable.pipe(
      concatMap((result) => {
        return from(result.stream).pipe(
              concatMap(async (chunk) => {
                const text = chunk.text();
                return text;
              })
        )
      })
      );
  }
}
