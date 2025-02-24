export interface Command {
    name: string;
    execute: () => void;
}
export interface FormattingCommand extends Command {
    icon?: string;
    label: string;
}
