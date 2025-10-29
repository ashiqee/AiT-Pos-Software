"use client";

import React, { ReactNode } from 'react';
import { FormProvider, SubmitHandler, UseFormReturn } from 'react-hook-form';

interface IACFormProps {
  children: ReactNode;
  onSubmit: SubmitHandler<any>;
  methods: UseFormReturn<any>; // pass form methods from parent
}

const ASForm = ({ children, onSubmit, methods }: IACFormProps) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};

export default ASForm;
