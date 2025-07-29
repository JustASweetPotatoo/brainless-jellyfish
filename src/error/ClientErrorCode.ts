/**
 * System error codes.
 *
 * 0xx: Informational (info)
 * 1xx: Warning (warning)
 * 2xx: Client-side error
 * 3xx: Server-side error
 *
 * System general error prefix: GE_xxx
 * System command error prefix: SYSC_xxx
 * System event error prefix: SYSE_xxx
 */

enum ErrorCode {
  /**
   * Unknown error code.
   * @description General error with no clear cause.
   * @fix Check the logs for more details.
   */
  UNKNOWN_ERROR = "GE_300",

  /**
   * Bot login failed.
   * @description Wrong token or something is going wrong !.
   * @fix Check the logs for more details.
   */
  LOGIN_FAILED = "GE_301",

  /**
   * Connector pool not found.
   * @description
   */
  POOL_NOT_FOUND = "GE_302",

  /**
   * Database connect failed
   * @description Connect to database failed
   */
  DATABASE_CONNECT_FAILED = "GE_303",

  /**
   * Execute query failed.
   * @description check the query log.
   */
  EXECUTE_QUERY_FAILED = "GE_304",

  /**
   * Table not found in database
   * @description Check name of database or table
   */
  DB_TABLE_NOT_FOUND = "GE_305",

  /**
   * Interaction has been replied.
   * @description The interaction has already been responded to.
   * @fix Review the interaction process.
   */
  INTERACTION_REPLIED = "GE_100",

  /**
   * No target channel.
   * @description the channel is undefined or null.
   * @fix Check the channel you provided for.
   */
  NO_TARGET_CHANNEL = "GE_200",

  // Command Error
  /**
   * Invalid message error.
   * @description The message does not meet the requirements.
   * @fix Check the message format.
   */
  MESSAGE_INVALID = "SYSC_201",

  /**
   * Invalid user error.
   * @description The user information is not valid.
   * @fix Verify user information.
   */
  USER_INVALID = "SYSC_202",

  /**
   * Builder is undefined or invalid.
   * @description The builder is not defined or is invalid.
   * @fix Ensure the builder has been initialized.
   */
  BUILDER_UNDEFINED_OR_INVALID = "SYSC_300",

  /**
   * Executor is undefined or invalid.
   * @description The executor is not defined or is invalid.
   * @fix Check if the executor has been initialized.
   */
  EXECUTOR_UNDEFINED_OR_INVALID = "SYSC_301",

  /**
   * Command option is undefined or invalid.
   * @description The command option is not defined or is invalid.
   * @fix Check the command options.
   */
  COMMAND_OPTION_UNDEFINED_OR_INVALID = "SYSC_302",

  /**
   * Failed to load command.
   * @description Unable to load the command from the system.
   * @fix Check the path or command resource.
   */
  LOAD_COMMAND_FAILED = "SYSC_303",

  /**
   * Failed to register command.
   * @description Unable to register the command in the system.
   * @fix Check access permissions and command information.
   */
  REGISTER_COMMAND_FAILED = "SYSC_304",

  /**
   * Failed to execute command.
   * @description Unable to execute the registered command.
   * @fix Check the conditions and command parameters.
   */
  EXECUTE_COMMAND_FAILED = "SYSC_305",

  // Event Error
  /**
   * Failed to load event.
   * @description Unable to load the event from the system.
   * @fix Check the path or event resource.
   */
  LOAD_EVENT_FAILED = "SYSE_300",

  /**
   * Failed to register event.
   * @description Unable to register the event in the system.
   * @fix Check access permissions and event information.
   */
  REGISTER_EVENT_FAILED = "SYSE_301",

  /**
   * Failed to execute event.
   * @description Unable to execute the registered event.
   * @fix Check the conditions and event parameters.
   */
  EXECUTE_EVENT_FAILED = "SYSE_302",

  /**
   * Failed to load component(s).
   * @description Unable to execute the registered event.
   * @fix Check the error message.
   */
  LOAD_COMPONENT_FAILED = "SYSCOM_300",

  /**
   * Failed to execute component interaction.
   * @description Unable to execute the registered event.
   * @fix Check the error message.
   */
  EXECUTE_COMPONENT_INTERACTION_FAILED = "SYSCOM_301",
}

/**
 * Corresponding error messages for each error code.
 */
const ErrorMessage: { [key in ErrorCode]: string } = {
  [ErrorCode.UNKNOWN_ERROR]: "An error occurred. Please check the logs",
  [ErrorCode.LOGIN_FAILED]: "Login Failed. Please check the logs",
  [ErrorCode.POOL_NOT_FOUND]: "Pool to execute query is not found",
  [ErrorCode.DATABASE_CONNECT_FAILED]: "Can't connect to database",
  [ErrorCode.EXECUTE_QUERY_FAILED]: "Execute query failed, please check the log",
  [ErrorCode.DB_TABLE_NOT_FOUND]: "Table is not found !",
  [ErrorCode.NO_TARGET_CHANNEL]: "The channel is undefined or invalid",
  [ErrorCode.INTERACTION_REPLIED]: "The interaction response has been sent",
  [ErrorCode.MESSAGE_INVALID]: "The message is invalid",
  [ErrorCode.USER_INVALID]: "The user is invalid",
  [ErrorCode.BUILDER_UNDEFINED_OR_INVALID]: "The builder is not defined or is invalid",
  [ErrorCode.EXECUTOR_UNDEFINED_OR_INVALID]: "The executor is not defined or is invalid",
  [ErrorCode.COMMAND_OPTION_UNDEFINED_OR_INVALID]: "The command option is not defined or is invalid",
  [ErrorCode.LOAD_COMMAND_FAILED]: "Failed to load the command",
  [ErrorCode.REGISTER_COMMAND_FAILED]: "Failed to register the command",
  [ErrorCode.EXECUTE_COMMAND_FAILED]: "Failed to execute the command",
  [ErrorCode.LOAD_EVENT_FAILED]: "Failed to load the event",
  [ErrorCode.REGISTER_EVENT_FAILED]: "Failed to register the event",
  [ErrorCode.EXECUTE_EVENT_FAILED]: "Failed to execute the event",
  [ErrorCode.LOAD_COMPONENT_FAILED]: "Failed to load the component",
  [ErrorCode.EXECUTE_COMPONENT_INTERACTION_FAILED]: "Failed to execute the component",
};

export { ErrorCode, ErrorMessage };
