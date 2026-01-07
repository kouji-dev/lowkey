export interface ComponentDefinition {
    jsClassName: string
    selector: string
    html: string
    inputs: InputDefinition[]
    dependencies: DependencyDefinition[]
}

export interface InputDefinition {
    name: string
    type: string
}

export interface DependencyDefinition {
    type: 'component'
    key: string
}

export interface AIResponse {
    rootComponent: string
    components: ComponentDefinition[]
  }