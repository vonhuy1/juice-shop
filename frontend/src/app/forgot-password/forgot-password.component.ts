import { Component } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { SecurityQuestionService } from '../Services/security-question.service';
import { UserService } from '../Services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { FormSubmitService } from '../Services/form-submit.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie';
import { AbstractControl } from '@angular/forms';
import { SecurityQuestion } from '../Models/securityQuestion.model';

import {  NgZone, type OnInit } from '@angular/core'

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  public emailControl: UntypedFormControl = new UntypedFormControl('', [Validators.required, Validators.email]);
  public securityQuestionControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required]);
  public passwordControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required, Validators.minLength(5)]);
  public repeatPasswordControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required, this.matchValidator(this.passwordControl)]);
  public securityQuestion?: string;
  public error?: string;
  public securityQuestions!: SecurityQuestion[];
  public securityAnswerControl: UntypedFormControl = new UntypedFormControl({ disabled: true, value: '' }, [Validators.required]);
  public selected?: number;
  public confirmation?: string;
  public questionOld?: number;
  public timeoutDuration = 1000;
  private timeout;
  public user: any;
  public rememberMe: UntypedFormControl = new UntypedFormControl(false);

  constructor (
    private readonly securityQuestionService: SecurityQuestionService,
    private readonly cookieService: CookieService,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly formSubmitService: FormSubmitService,
    private readonly ngZone: NgZone,
    private readonly translate: TranslateService
  ) { }

  ngOnInit () {
    
    this.securityQuestionService.find(null).subscribe((securityQuestions: any) => {
      this.securityQuestions = securityQuestions;
    }, (err) => { console.log(err); });
  }

  findSecurityQuestion () {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.securityQuestion = undefined;
      this.questionOld = undefined;
      if (this.emailControl.value) {
        this.securityQuestionService.find(null).subscribe((securityQuestions: any) => {
          if (securityQuestions) {
            this.securityQuestionService.findBy(this.emailControl.value).subscribe(
              (securityQuestion: SecurityQuestion) => {
                if (securityQuestion) {
                  this.questionOld = securityQuestion.id;
                }
              },
              (error: any) => {
                console.error('Error fetching security question:', error);
              }
            );
            this.securityQuestion = securityQuestions.find((question) => question.id === this.securityQuestionControl.value);
            this.securityQuestionControl.enable();
            this.securityAnswerControl.enable();
            this.passwordControl.enable();
            this.repeatPasswordControl.enable();
          } else {
            this.securityQuestionControl.disable();
            this.passwordControl.disable();
            this.repeatPasswordControl.disable();
          }
        }, (error) => error);
      } else {
        this.securityQuestionControl.disable();
        this.passwordControl.disable();
        this.repeatPasswordControl.disable();
      }
    }, this.timeoutDuration);
  }

  resetPassword () {
    this.userService.resetPassword({
      email: this.emailControl.value,
      answer: this.securityAnswerControl.value,
      new: this.passwordControl.value,
      repeat: this.repeatPasswordControl.value,
      old: this.questionOld,
      current: this.securityQuestionControl.value
    }).subscribe(() => {
      this.error = undefined;
      this.translate.get('PASSWORD_SUCCESSFULLY_CHANGED').subscribe((passwordSuccessfullyChanged) => {
        this.confirmation = passwordSuccessfullyChanged;
        // Đăng nhập lại người dùng sau khi thực hiện reset mật khẩu thành công
      this.user = {
        email: this.emailControl.value,
        password: this.repeatPasswordControl.value
      };

      this.userService.login(this.user).subscribe((authentication: any) => {
        localStorage.setItem('token', authentication.token);
        const expires = new Date();
        expires.setHours(expires.getHours() + 8);
        this.cookieService.put('token', authentication.token, { expires });
        this.router.navigate(['/search']);
      }, ({ error }) => {
        if (error.status && error.data && error.status === 'totp_token_required') {
          localStorage.setItem('totp_tmp_token', error.data.tmpToken)
          this.ngZone.run(async () => await this.router.navigate(['/2fa/enter']))
          return
        }
      });
      }, (translationId) => {
        this.confirmation = translationId;

      });
      //this.resetForm();

      

    }, (error) => {
      this.error = error.error;
      this.confirmation = undefined;
      this.resetErrorForm();
    });
  }

  resetForm () {
    this.emailControl.setValue('');
    this.emailControl.markAsPristine();
    this.emailControl.markAsUntouched();
    this.securityQuestionControl.setValue('');
    this.securityQuestionControl.markAsPristine();
    this.securityQuestionControl.markAsUntouched();
    this.passwordControl.setValue('');
    this.passwordControl.markAsPristine();
    this.passwordControl.markAsUntouched();
    this.repeatPasswordControl.setValue('');
    this.repeatPasswordControl.markAsPristine();
    this.repeatPasswordControl.markAsUntouched();
  }

  resetErrorForm () {
    this.emailControl.markAsPristine();
    this.emailControl.markAsUntouched();
    this.securityQuestionControl.setValue('');
    this.securityQuestionControl.markAsPristine();
    this.securityQuestionControl.markAsUntouched();
    this.passwordControl.setValue('');
    this.passwordControl.markAsPristine();
    this.passwordControl.markAsUntouched();
    this.repeatPasswordControl.setValue('');
    this.repeatPasswordControl.markAsPristine();
    this.repeatPasswordControl.markAsUntouched();
  }

  matchValidator (passwordControl: AbstractControl) {
    return function matchOtherValidate (repeatPasswordControl: UntypedFormControl) {
      const password = passwordControl.value;
      const passwordRepeat = repeatPasswordControl.value;
      if (password !== passwordRepeat) {
        return { notSame: true };
      }
      return null;
    };
  }
}
