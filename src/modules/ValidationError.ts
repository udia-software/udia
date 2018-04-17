import { GraphQLError } from "graphql";

export interface IErrorMessage {
  key: string;
  message: string;
}

interface IErrorState {
  [key: string]: string[] | undefined;
  messages?: string[];
}

/**
 * Custom Validation Error class to pass back mutation/query state.
 */
export class ValidationError extends GraphQLError {
  public state: IErrorState;

  constructor(errors: IErrorMessage[] = []) {
    const errorState: IErrorState = {};
    const errorMessage = ["The request is invalid."];
    errors.forEach(error => {
      if (errorState.hasOwnProperty(error.key)) {
        errorState[error.key]!.push(error.message);
      } else {
        errorState[error.key] = [error.message];
      }
      errorMessage.push(`* ${error.key}: ${error.message}`);
    });
    super(errorMessage.join("\n"));
    this.state = errorState;
  }
}
