import * as Select from '@radix-ui/react-select';
import { UiIcon } from './UiIcon';
export type IrisOption={value:string;label:string;description?:string};
export function IrisSelect({label,value,options,disabled,onChange,icon}:{label:string;value:string;options:IrisOption[];disabled?:boolean;onChange:(value:string)=>void;icon?:string}){
  return <Select.Root value={value||'__native__'} disabled={disabled} onValueChange={next=>onChange(next==='__native__'?'':next)}>
    <Select.Trigger className="iris-select-trigger" aria-label={label} title={label}>
      {icon&&<UiIcon name={icon} flat/>}<Select.Value/><Select.Icon className="select-chevron"><UiIcon name="chevron"/></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content className="iris-select-menu" position="popper" side="top" align="end" sideOffset={8} collisionPadding={12}>
      <Select.ScrollUpButton className="select-scroll up"><UiIcon name="chevron"/></Select.ScrollUpButton>
      <Select.Viewport><Select.Group><Select.Label className="iris-select-label">{label}</Select.Label>{options.map(option=><Select.Item className="iris-select-item" key={option.value} value={option.value||'__native__'} textValue={option.label}>
        <span className="select-mark"><Select.ItemIndicator><UiIcon name="check"/></Select.ItemIndicator></span>
        <span><Select.ItemText>{option.label}</Select.ItemText>{option.description&&<small>{option.description}</small>}</span>
      </Select.Item>)}</Select.Group></Select.Viewport>
      <Select.ScrollDownButton className="select-scroll"><UiIcon name="chevron"/></Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>;
}
