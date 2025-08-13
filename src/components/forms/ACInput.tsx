'use client'

import React from 'react';
import {useFormContext } from "react-hook-form";

import { IInput } from '@/types';
import { Input } from '@heroui/input';

interface IProps extends IInput{}

const ACInput = ({
    variant ='bordered',
    size="md",
    isRequired=false,
    type="text",
    label,
    name
}:IProps) => {


    const {register,
        formState:{errors},
    }=useFormContext()

    return (
        <Input
        {...register(name)}
      
        isInvalid={!!errors[name]}
        label={label}
        name={name}
        isRequired={isRequired}
        size={size}
        type={type}
        variant={variant}


        />
    );
};

export default ACInput;