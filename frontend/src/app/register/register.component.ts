/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { SecurityAnswerService } from '../Services/security-answer.service'
import { UserService } from '../Services/user.service'
import { AbstractControl, FormControl, Validators } from '@angular/forms'
import { Component, NgZone, OnInit } from '@angular/core'
import { SecurityQuestionService } from '../Services/security-question.service'
import { Router } from '@angular/router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { CookieService } from 'ngx-cookie';
import { faExclamationCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FormSubmitService } from '../Services/form-submit.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'
import { TranslateService } from '@ngx-translate/core'
import { SecurityQuestion } from '../Models/securityQuestion.model'

library.add(faUserPlus, faExclamationCircle)

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  public emailControl: FormControl = new FormControl('', [Validators.required, Validators.email])
  public passwordControl: FormControl = new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(40)])
  public repeatPasswordControl: FormControl = new FormControl('', [Validators.required, this.matchValidator(this.passwordControl)])
  public securityQuestionControl: FormControl = new FormControl('', [Validators.required])
  public securityAnswerControl: FormControl = new FormControl('', [Validators.required])
  public securityQuestions!: SecurityQuestion[]
  public selected?: number
  public error: string | null = null
  public user: any;

  constructor (
    private readonly securityQuestionService: SecurityQuestionService,
    private readonly userService: UserService,
    private readonly securityAnswerService: SecurityAnswerService,
    private readonly router: Router,
    private readonly formSubmitService: FormSubmitService,
    private readonly translateService: TranslateService,
    private readonly snackBar: MatSnackBar,
    private readonly snackBarHelperService: SnackBarHelperService,
    private readonly cookieService: CookieService,
    private readonly ngZone: NgZone
  ) { }

  ngOnInit () {
    this.securityQuestionService.find(null).subscribe((securityQuestions: any) => {
      this.securityQuestions = securityQuestions
    }, (err) => { console.log(err) })

    this.formSubmitService.attachEnterKeyHandler('registration-form', 'registerButton', () => { this.save() })
  }

  save () {
    const user = {
      email: this.emailControl.value,
      password: this.passwordControl.value,
      passwordRepeat: this.repeatPasswordControl.value,
      securityQuestion: this.securityQuestions.find((question) => question.id === this.securityQuestionControl.value),
      securityAnswer: this.securityAnswerControl.value
    }

    this.userService.save(user).subscribe((response: any) => {
      this.securityAnswerService.save({
        UserId: response.id,
        answer: this.securityAnswerControl.value,
        SecurityQuestionId: this.securityQuestionControl.value
      }).subscribe(() => {
        this.user = {
          email: this.emailControl.value.replace(/.(?=.{2,}@)/g, 'x'),
          password: this.repeatPasswordControl.value
        };
        this.userService.login(this.user).subscribe((authentication: any) => {
          localStorage.setItem('token', authentication.token);
          const expires = new Date();
          expires.setHours(expires.getHours() + 8);
          this.cookieService.put('token', authentication.token, { expires });
          this.router.navigate(['/search']);
          this.snackBarHelperService.open('CONFIRM_REGISTER');
        });
      }, (err) => {
        console.log(err);
        if (err.error?.errors) {
          const error = err.error.errors[0];
          if (error.message) {
            this.error = error.message[0].toUpperCase() + error.message.slice(1);
          } else {
            this.error = error;
          }
        }
      });
    });
  }

  matchValidator (passwordControl: AbstractControl) {
    return function matchOtherValidate (repeatPasswordControl: FormControl) {
      const password = passwordControl.value;
      const passwordRepeat = repeatPasswordControl.value;
      if (password !== passwordRepeat) {
        return { notSame: true };
      }
      return null;
    };
  }
}
