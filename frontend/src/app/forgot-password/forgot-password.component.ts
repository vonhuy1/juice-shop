/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { UserService } from '../Services/user.service'
import { SecurityQuestionService } from '../Services/security-question.service'
import { type AbstractControl, UntypedFormControl, Validators } from '@angular/forms'
import { Component } from '@angular/core'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSave } from '@fortawesome/free-solid-svg-icons'
import { faEdit } from '@fortawesome/free-regular-svg-icons'
import { type SecurityQuestion } from '../Models/securityQuestion.model'
import { TranslateService } from '@ngx-translate/core'
import { FormSubmitService } from '../Services/form-submit.service'
library.add(faSave, faEdit)

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  public emailControl: UntypedFormControl = new UntypedFormControl('', [Validators.required, Validators.email])
  public securityQuestionControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required])
  public passwordControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required, Validators.minLength(5)])
  public repeatPasswordControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required, matchValidator(this.passwordControl)])
  public securityQuestion?: string
  public error?: string
  public securityQuestions!: SecurityQuestion[]
  public securityAnswerControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required])
  public selected?: number
  public confirmation?: string
  public questionOld?: number
  public timeoutDuration = 1000
  private timeout

  constructor (private readonly securityQuestionService: SecurityQuestionService, private readonly userService: UserService,private readonly formSubmitService: FormSubmitService, private readonly translate: TranslateService) { }
  ngOnInit () {
    this.securityQuestionService.find(null).subscribe((securityQuestions: any) => {
      this.securityQuestions = securityQuestions
    }, (err) => { console.log(err) })

    
  }
  
  
  findSecurityQuestion () {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.securityQuestion = undefined
      this.questionOld = undefined
      if (this.emailControl.value) {
  
        
        
        this.securityQuestionService.find(null).subscribe((securityQuestions: any) => {
          if (securityQuestions) {
            this.securityQuestionService.findBy(this.emailControl.value).subscribe(
              (securityQuestion: SecurityQuestion) => {
                // Xử lý khi có kết quả trả về từ observable
                if (securityQuestion) {
                  // Gán giá trị thuộc tính của đối tượng SecurityQuestion cho biến questionOld
                  this.questionOld = securityQuestion.id
                  console.log(JSON.stringify(this.questionOld));
    
                } else {
                  // Xử lý trường hợp không tìm thấy đối tượng SecurityQuestion
                }
              },
              (error: any) => {
                // Xử lý khi có lỗi xảy ra trong quá trình lấy dữ liệu từ observable
                console.error('Error fetching security question:', error);
              }
            );
            this.securityQuestion = securityQuestions.find((question) => question.id === this.securityQuestionControl.value)
            this.securityQuestionControl.enable()
            this.securityAnswerControl.enable()
            
            this.passwordControl.enable()
            this.repeatPasswordControl.enable()
            
          } else {
            this.securityQuestionControl.disable()
            this.passwordControl.disable()
            this.repeatPasswordControl.disable()
          }
        },
        (error) => error
        )
      } else {
        this.securityQuestionControl.disable()
        this.passwordControl.disable()
        this.repeatPasswordControl.disable()
      }
    }, this.timeoutDuration)
  }

  resetPassword () {
    this.userService.resetPassword({
      email: this.emailControl.value,
      answer:this.securityAnswerControl.value,
      new: this.passwordControl.value,
      repeat: this.repeatPasswordControl.value,
      old: this.questionOld,
      current: this.securityQuestionControl.value

    }).subscribe(() => {
      this.error = undefined
      this.translate.get('PASSWORD_SUCCESSFULLY_CHANGED').subscribe((passwordSuccessfullyChanged) => {
        this.confirmation = passwordSuccessfullyChanged
      }, (translationId) => {
        this.confirmation = translationId
      })
      this.resetForm()
    }, (error) => {
      this.error = error.error
      this.confirmation = undefined
      this.resetErrorForm()
    })
  }

  resetForm () {
    this.emailControl.setValue('')
    this.emailControl.markAsPristine()
    this.emailControl.markAsUntouched()
    this.securityQuestionControl.setValue('')
    this.securityQuestionControl.markAsPristine()
    this.securityQuestionControl.markAsUntouched()
    this.passwordControl.setValue('')
    this.passwordControl.markAsPristine()
    this.passwordControl.markAsUntouched()
    this.repeatPasswordControl.setValue('')
    this.repeatPasswordControl.markAsPristine()
    this.repeatPasswordControl.markAsUntouched()
  }

  resetErrorForm () {
    this.emailControl.markAsPristine()
    this.emailControl.markAsUntouched()
    this.securityQuestionControl.setValue('')
    this.securityQuestionControl.markAsPristine()
    this.securityQuestionControl.markAsUntouched()
    this.passwordControl.setValue('')
    this.passwordControl.markAsPristine()
    this.passwordControl.markAsUntouched()
    this.repeatPasswordControl.setValue('')
    this.repeatPasswordControl.markAsPristine()
    this.repeatPasswordControl.markAsUntouched()
  }
}

function matchValidator (passwordControl: AbstractControl) {
  return function matchOtherValidate (repeatPasswordControl: UntypedFormControl) {
    const password = passwordControl.value
    const passwordRepeat = repeatPasswordControl.value
    if (password !== passwordRepeat) {
      return { notSame: true }
    }
    return null
  }
}
